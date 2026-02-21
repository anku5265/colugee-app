import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, FileSpreadsheet, Check, X, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface BulkScheduleImportProps {
  user: any;
  institutionId: string;
  onImportComplete: () => void;
}

interface PreviewRow {
  title: string;
  subject: string;
  teacher_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_location: string;
  target_year: number | null;
  target_section: string;
  target_branch: string;
  target_department: string;
  isValid: boolean;
  errors: string[];
}

const DAYS_MAP: Record<string, number> = {
  'sunday': 0, 'sun': 0,
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6
};

const DAYS_REVERSE: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday'
};

export const BulkScheduleImport = ({ user, institutionId, onImportComplete }: BulkScheduleImportProps) => {
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Title': 'Data Structures Lecture',
        'Subject': 'Computer Science',
        'Teacher Name': 'Dr. Smith',
        'Day': 'Monday',
        'Start Time': '09:00',
        'End Time': '10:00',
        'Room': 'Room 101',
        'Year': '2',
        'Section': 'A',
        'Branch': 'CSE',
        'Department': 'Engineering'
      },
      {
        'Title': 'Physics Lab',
        'Subject': 'Physics',
        'Teacher Name': 'Prof. Johnson',
        'Day': 'Tuesday',
        'Start Time': '14:00',
        'End Time': '16:00',
        'Room': 'Lab 3',
        'Year': '1',
        'Section': 'B',
        'Branch': 'ECE',
        'Department': 'Engineering'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedules");
    XLSX.writeFile(wb, "schedule_import_template.xlsx");
    toast.success("Template downloaded");
  };

  const parseTimeString = (time: string): string => {
    if (!time) return '09:00';
    
    // Handle various time formats
    const cleaned = time.toString().trim();
    
    // If already in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
      const [hours, mins] = cleaned.split(':');
      return `${hours.padStart(2, '0')}:${mins}`;
    }
    
    // Handle HHMM format
    if (/^\d{4}$/.test(cleaned)) {
      return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    }
    
    // Handle decimal (Excel time)
    if (!isNaN(parseFloat(cleaned))) {
      const totalMinutes = Math.round(parseFloat(cleaned) * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const mins = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    return '09:00';
  };

  const parseDayOfWeek = (day: string | number): number => {
    if (typeof day === 'number') {
      return day >= 0 && day <= 6 ? day : 1;
    }
    
    const dayStr = day.toString().toLowerCase().trim();
    return DAYS_MAP[dayStr] ?? 1;
  };

  const validateRow = (row: Partial<PreviewRow>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!row.title?.trim()) errors.push('Title required');
    if (!row.subject?.trim()) errors.push('Subject required');
    if (row.day_of_week === undefined || row.day_of_week < 0 || row.day_of_week > 6) {
      errors.push('Invalid day');
    }
    if (!row.start_time || !/^\d{2}:\d{2}$/.test(row.start_time)) {
      errors.push('Invalid start time');
    }
    if (!row.end_time || !/^\d{2}:\d{2}$/.test(row.end_time)) {
      errors.push('Invalid end time');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedRows: PreviewRow[] = jsonData.map((row: any) => {
          const parsedRow: Partial<PreviewRow> = {
            title: row['Title'] || row['title'] || '',
            subject: row['Subject'] || row['subject'] || '',
            teacher_name: row['Teacher Name'] || row['teacher_name'] || row['Teacher'] || '',
            day_of_week: parseDayOfWeek(row['Day'] || row['day'] || row['Day of Week'] || 1),
            start_time: parseTimeString(row['Start Time'] || row['start_time'] || row['Start'] || '09:00'),
            end_time: parseTimeString(row['End Time'] || row['end_time'] || row['End'] || '10:00'),
            room_location: row['Room'] || row['room_location'] || row['Location'] || '',
            target_year: row['Year'] ? parseInt(row['Year']) : null,
            target_section: row['Section'] || row['section'] || '',
            target_branch: row['Branch'] || row['branch'] || '',
            target_department: row['Department'] || row['department'] || ''
          };

          const { isValid, errors } = validateRow(parsedRow);
          
          return {
            ...parsedRow,
            isValid,
            errors
          } as PreviewRow;
        });

        setPreviewData(parsedRows);
        toast.success(`Loaded ${parsedRows.length} schedules for preview`);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error("Failed to read file");
    }

    // Reset input
    event.target.value = '';
  };

  const handleImport = async () => {
    const validRows = previewData.filter(row => row.isValid);
    if (validRows.length === 0) {
      toast.error("No valid schedules to import");
      return;
    }

    setImporting(true);
    try {
      const schedulesToInsert = validRows.map(row => ({
        title: row.title,
        subject: row.subject,
        teacher_name: row.teacher_name || null,
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
        room_location: row.room_location || null,
        target_year: row.target_year,
        target_section: row.target_section || null,
        target_branch: row.target_branch || null,
        target_department: row.target_department || null,
        institution_id: institutionId,
        created_by: user.id
      }));

      const { error } = await supabase
        .from('schedules')
        .insert(schedulesToInsert);

      if (error) throw error;

      // Create notifications for teachers
      const teacherNames = [...new Set(validRows.map(r => r.teacher_name).filter(Boolean))];
      if (teacherNames.length > 0) {
        // Find teacher profiles and notify them
        const { data: teachers } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('institution_id', institutionId)
          .in('role', ['teacher', 'authority'])
          .in('full_name', teacherNames);

        if (teachers && teachers.length > 0) {
          const notifications = teachers.map(teacher => ({
            user_id: teacher.user_id,
            type: 'schedule_assigned',
            title: 'New Schedule Assigned',
            description: `You have been assigned new class schedules. Check your teaching schedule for details.`,
            created_by: user.id
          }));

          await supabase.from('notifications').insert(notifications);
        }
      }

      toast.success(`Successfully imported ${validRows.length} schedules`);
      setPreviewData([]);
      onImportComplete();
    } catch (error: any) {
      console.error('Error importing schedules:', error);
      toast.error(error.message || "Failed to import schedules");
    } finally {
      setImporting(false);
    }
  };

  const validCount = previewData.filter(r => r.isValid).length;
  const invalidCount = previewData.filter(r => !r.isValid).length;

  return (
    <Card className="glass-effect">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Bulk Schedule Import
            </CardTitle>
            <CardDescription>Import multiple schedules from Excel/CSV file</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {previewData.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewData([])}>
                  Clear
                </Button>
                <Button onClick={handleImport} disabled={importing || validCount === 0}>
                  {importing ? 'Importing...' : `Import ${validCount} Schedules`}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Target</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index} className={!row.isValid ? 'bg-destructive/10' : ''}>
                      <TableCell>
                        {row.isValid ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>{DAYS_REVERSE[row.day_of_week]}</TableCell>
                      <TableCell className="text-xs">
                        {row.start_time} - {row.end_time}
                      </TableCell>
                      <TableCell>{row.teacher_name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.target_year && <Badge variant="outline" className="text-xs">Y{row.target_year}</Badge>}
                          {row.target_section && <Badge variant="outline" className="text-xs">{row.target_section}</Badge>}
                          {row.target_branch && <Badge variant="outline" className="text-xs">{row.target_branch}</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {invalidCount > 0 && (
              <div className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {invalidCount} row(s) have errors and will be skipped during import.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Upload an Excel or CSV file to import schedules</p>
            <p className="text-sm">Download the template to see the expected format</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
