import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lock, 
  Users, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  History,
  Eye,
  EyeOff,
  Shield,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { ScheduleManager } from "@/components/erp/ScheduleManager";
import { BulkScheduleImport } from "@/components/erp/BulkScheduleImport";
import { ScheduleCopyTool } from "@/components/erp/ScheduleCopyTool";

interface SecureAdminPanelProps {
  user: any;
  profile: any;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  year_of_study: number | null;
  Course: string | null;
  section: string | null;
  branch: string | null;
  institution_roll_number: string | null;
  student_id: string | null;
  phone_number: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  cover_picture_url: string | null;
  links: string[] | null;
  daily_streak: number | null;
  connections_count: number | null;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  authority_user_id: string;
  action_type: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
}

export const SecureAdminPanel = ({ user, profile }: SecureAdminPanelProps) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  
  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    department: "",
    year_of_study: "",
    Course: "",
    section: "",
    branch: "",
    role: "",
    phone_number: "",
    bio: "",
    student_id: ""
  });

  // Add user dialog - password is auto-generated and emailed to user
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    email: "",
    full_name: "",
    role: "student",
    department: "",
    year_of_study: "",
    institution_roll_number: "",
    phone_number: "",
    Course: "",
    section: "",
    branch: ""
  });

  // Unique values for filters
  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);
  const [uniqueSections, setUniqueSections] = useState<string[]>([]);
  const [uniqueBranches, setUniqueBranches] = useState<string[]>([]);
  
  // Schedule management
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  
  const handleScheduleImportComplete = () => {
    setScheduleRefreshKey(prev => prev + 1);
  };

  const handleUnlock = async () => {
    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_panel_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_panel_password')
        .single();

      if (error) throw error;

      if (data?.setting_value === password) {
        setIsUnlocked(true);
        setPassword("");
        toast.success("Access granted");
        
        // Log the login action
        await logAction('login', null, { success: true });
        
        // Fetch data
        fetchUsers();
        fetchAuditLogs();
      } else {
        toast.error("Invalid password");
        await logAction('login_failed', null, { success: false });
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      toast.error("Error verifying password");
    }
  };

  const logAction = async (actionType: string, targetUserId: string | null, details: any) => {
    try {
      await supabase.rpc('log_authority_action', {
        p_action_type: actionType,
        p_target_user_id: targetUserId,
        p_details: details
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('institution_id', profile.institution_id)
        .order('full_name');

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);

      // Extract unique values for filters
      const years = [...new Set(data?.map(u => u.year_of_study).filter(Boolean))] as number[];
      const courses = [...new Set(data?.map(u => u.Course).filter(Boolean))] as string[];
      const sections = [...new Set(data?.map(u => u.section).filter(Boolean))] as string[];
      const branches = [...new Set(data?.map(u => u.branch).filter(Boolean))] as string[];

      setUniqueYears(years.sort());
      setUniqueCourses(courses.sort());
      setUniqueSections(sections.sort());
      setUniqueBranches(branches.sort());
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('authority_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.institution_roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterYear !== "all") {
      filtered = filtered.filter(u => u.year_of_study?.toString() === filterYear);
    }

    if (filterCourse !== "all") {
      filtered = filtered.filter(u => u.Course === filterCourse);
    }

    if (filterSection !== "all") {
      filtered = filtered.filter(u => u.section === filterSection);
    }

    if (filterBranch !== "all") {
      filtered = filtered.filter(u => u.branch === filterBranch);
    }

    if (filterRole !== "all") {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterYear, filterCourse, filterSection, filterBranch, filterRole, users]);

  const handleViewUser = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setViewDialogOpen(true);
  };

  const handleEditUser = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setEditForm({
      full_name: userProfile.full_name || "",
      department: userProfile.department || "",
      year_of_study: userProfile.year_of_study?.toString() || "",
      Course: userProfile.Course || "",
      section: userProfile.section || "",
      branch: userProfile.branch || "",
      role: userProfile.role || "",
      phone_number: userProfile.phone_number || "",
      bio: userProfile.bio || "",
      student_id: userProfile.student_id || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        department: editForm.department,
        year_of_study: editForm.year_of_study ? parseInt(editForm.year_of_study) : null,
        Course: editForm.Course || null,
        section: editForm.section || null,
        branch: editForm.branch || null,
        phone_number: editForm.phone_number || null,
        bio: editForm.bio || null
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (error) throw error;

      await logAction('edit_user', selectedUser.user_id, { 
        changes: updateData,
        user_name: selectedUser.full_name 
      });

      toast.success("User updated successfully");
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error("Failed to update user");
    }
  };

  const handleAddUser = async () => {
    // Validate required admin-controlled fields
    if (!addUserForm.email || !addUserForm.full_name || !addUserForm.department) {
      toast.error("Please fill in all required fields: Email, Full Name, and Department");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addUserForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setAddUserLoading(true);
    try {
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: addUserForm.email,
          full_name: addUserForm.full_name,
          role: addUserForm.role,
          department: addUserForm.department,
          year_of_study: addUserForm.year_of_study || null,
          institution_roll_number: addUserForm.institution_roll_number || null,
          phone_number: addUserForm.phone_number || null,
          Course: addUserForm.Course || null,
          section: addUserForm.section || null,
          branch: addUserForm.branch || null
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create user');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`User ${addUserForm.full_name} created successfully. Login credentials have been sent to their email.`);
      setAddUserDialogOpen(false);
      setAddUserForm({
        email: "",
        full_name: "",
        role: "student",
        department: "",
        year_of_study: "",
        institution_roll_number: "",
        phone_number: "",
        Course: "",
        section: "",
        branch: ""
      });
      fetchUsers();
      fetchAuditLogs();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleDeleteUser = async (userProfile: UserProfile) => {
    if (!confirm(`Are you sure you want to remove ${userProfile.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Note: This only removes from profiles, actual auth user deletion requires admin SDK
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userProfile.id);

      if (error) throw error;

      await logAction('delete_user', userProfile.user_id, { 
        user_name: userProfile.full_name,
        user_email: userProfile.email
      });

      toast.success("User removed successfully");
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Failed to delete user");
    }
  };

  const handleExportExcel = async () => {
    try {
      const exportData = filteredUsers.map(u => ({
        'Full Name': u.full_name,
        'Email': u.email,
        'Phone Number': u.phone_number,
        'Student ID': u.student_id,
        'Roll Number': u.institution_roll_number,
        'Role': u.role,
        'Department': u.department,
        'Year': u.year_of_study,
        'Course': u.Course,
        'Section': u.section,
        'Branch': u.branch,
        'Bio': u.bio,
        'Daily Streak': u.daily_streak,
        'Connections': u.connections_count,
        'Last Activity': u.last_activity_date,
        'Created At': u.created_at,
        'Updated At': u.updated_at
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      XLSX.writeFile(wb, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);

      await logAction('export', null, { 
        count: filteredUsers.length,
        filters: { filterYear, filterCourse, filterSection, filterBranch, filterRole }
      });

      toast.success(`Exported ${filteredUsers.length} users`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error("Failed to export data");
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process imported data - update existing users
        let updated = 0;
        for (const row of jsonData as any[]) {
          if (row['Email'] || row['Roll Number']) {
            const { error } = await supabase
              .from('profiles')
              .update({
                department: row['Department'] || undefined,
                year_of_study: row['Year'] ? parseInt(row['Year']) : undefined,
                Course: row['Course'] || undefined,
                section: row['Section'] || undefined,
                branch: row['Branch'] || undefined
              })
              .eq('institution_id', profile.institution_id)
              .or(`email.eq.${row['Email']},institution_roll_number.eq.${row['Roll Number']}`);

            if (!error) updated++;
          }
        }

        await logAction('import', null, { 
          file_name: file.name,
          rows_processed: jsonData.length,
          rows_updated: updated
        });

        toast.success(`Imported and updated ${updated} users`);
        fetchUsers();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing:', error);
      toast.error("Failed to import data");
    }

    // Reset input
    event.target.value = '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'login': return 'default';
      case 'login_failed': return 'destructive';
      case 'edit_user': return 'secondary';
      case 'delete_user': return 'destructive';
      case 'export': return 'outline';
      case 'import': return 'outline';
      default: return 'secondary';
    }
  };

  if (!isUnlocked) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Secure Admin Panel</CardTitle>
          <CardDescription>
            Enter the admin password to access user management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter admin password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={handleUnlock} className="w-full">
            <Shield className="h-4 w-4 mr-2" />
            Unlock Panel
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="text-sm">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="schedules" className="text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-sm">
            <History className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="col-span-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name, email, roll..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYears.map(y => (
                      <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {uniqueCourses.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSection} onValueChange={setFilterSection}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {uniqueSections.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {uniqueBranches.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="authority">Authority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setAddUserDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Label htmlFor="import-excel" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
              </Label>
              <input
                id="import-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name/Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{u.phone_number || '-'}</TableCell>
                        <TableCell className="text-sm">{u.institution_roll_number || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{u.year_of_study || '-'}</TableCell>
                        <TableCell className="text-sm">{u.branch || '-'}</TableCell>
                        <TableCell className="text-sm">{u.section || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewUser(u)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditUser(u)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUser(u)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          {/* Schedule Manager */}
          <ScheduleManager 
            key={scheduleRefreshKey} 
            user={user} 
            institutionId={profile.institution_id} 
          />
          
          {/* Bulk Import */}
          <BulkScheduleImport 
            user={user} 
            institutionId={profile.institution_id}
            onImportComplete={handleScheduleImportComplete}
          />
          
          {/* Copy Schedules to Section */}
          <ScheduleCopyTool 
            user={user} 
            institutionId={profile.institution_id}
            onCopyComplete={handleScheduleImportComplete}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Activity Log</CardTitle>
              <CardDescription>Recent actions by all authorities</CardDescription>
            </CardHeader>
            <ScrollArea className="h-[450px]">
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No activity recorded</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border border-border/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getActionBadgeColor(log.action_type)} className="text-xs">
                              {log.action_type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-sm text-muted-foreground">
                              {log.details.user_name && `User: ${log.details.user_name}`}
                              {log.details.count && `Exported ${log.details.count} records`}
                              {log.details.rows_updated !== undefined && `Updated ${log.details.rows_updated} records`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={editForm.department}
                    onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year of Study</Label>
                  <Input
                    type="number"
                    value={editForm.year_of_study}
                    onChange={(e) => setEditForm(prev => ({ ...prev, year_of_study: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Input
                    value={editForm.Course}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Course: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input
                    value={editForm.section}
                    onChange={(e) => setEditForm(prev => ({ ...prev, section: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input
                    value={editForm.branch}
                    onChange={(e) => setEditForm(prev => ({ ...prev, branch: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Input
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Short bio"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete profile information for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {selectedUser && (
              <div className="space-y-6 pr-4">
                {/* Profile Picture & Basic Info */}
                <div className="flex items-start gap-4">
                  {selectedUser.profile_picture_url ? (
                    <img 
                      src={selectedUser.profile_picture_url} 
                      alt={selectedUser.full_name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                    <Badge variant="outline" className="capitalize mt-1">{selectedUser.role}</Badge>
                    <p className="text-sm text-muted-foreground mt-2">{selectedUser.bio || 'No bio provided'}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{selectedUser.phone_number || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Academic Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Student ID</p>
                      <p className="font-medium">{selectedUser.student_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Roll Number</p>
                      <p className="font-medium">{selectedUser.institution_roll_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedUser.department || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Year of Study</p>
                      <p className="font-medium">{selectedUser.year_of_study || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Course</p>
                      <p className="font-medium">{selectedUser.Course || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{selectedUser.branch || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Section</p>
                      <p className="font-medium">{selectedUser.section || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Activity & Stats */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Activity & Stats</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Daily Streak</p>
                      <p className="font-medium">{selectedUser.daily_streak || 0} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Connections</p>
                      <p className="font-medium">{selectedUser.connections_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Activity</p>
                      <p className="font-medium">{selectedUser.last_activity_date ? formatDate(selectedUser.last_activity_date) : 'Never'}</p>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">System Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">User ID</p>
                      <p className="font-medium font-mono text-xs">{selectedUser.user_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profile ID</p>
                      <p className="font-medium font-mono text-xs">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created At</p>
                      <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated At</p>
                      <p className="font-medium">{formatDate(selectedUser.updated_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Links */}
                {selectedUser.links && selectedUser.links.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.links.map((link, index) => (
                        <a 
                          key={index} 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Password Note */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 inline mr-2" />
                    <strong>Note:</strong> User passwords are securely managed by Supabase Auth and cannot be viewed or exported for security reasons.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (selectedUser) handleEditUser(selectedUser);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. A secure password will be auto-generated and sent to the user's email.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Info banner about password */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-sm text-primary">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Password will be auto-generated and emailed to the user. They can change it after logging in.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={addUserForm.full_name}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select 
                    value={addUserForm.role} 
                    onValueChange={(value) => setAddUserForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="authority">Authority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Input
                    value={addUserForm.department}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year of Study</Label>
                  <Input
                    type="number"
                    value={addUserForm.year_of_study}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, year_of_study: e.target.value }))}
                    placeholder="1, 2, 3..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Roll Number</Label>
                  <Input
                    value={addUserForm.institution_roll_number}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, institution_roll_number: e.target.value }))}
                    placeholder="Institution roll number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={addUserForm.phone_number}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Input
                    value={addUserForm.Course}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, Course: e.target.value }))}
                    placeholder="e.g. B.Tech"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input
                    value={addUserForm.section}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="e.g. A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input
                    value={addUserForm.branch}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="e.g. CSE"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={addUserLoading}>
              {addUserLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
