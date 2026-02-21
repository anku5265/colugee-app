import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, BookOpen, Award, Plus, X, Upload, Link as LinkIcon } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  student_id?: string;
  year_of_study?: number;
  department: string;
  bio?: string;
  profile_picture_url?: string;
  cover_picture_url?: string;
  phone_number?: string;
  role?: string;
  links?: string[];
}

interface EducationDetails {
  id: string;
  degree: string;
  major: string;
  minor?: string;
  graduation_year: number;
  gpa?: number;
  achievements: string[];
  certifications: string[];
}

interface ProfilePageProps {
  user: any;
}

export const ProfilePage = ({ user }: ProfilePageProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [education, setEducation] = useState<EducationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newAchievement, setNewAchievement] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newLink, setNewLink] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEducation();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create initial profile
        const newProfile = {
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "",
          department: "",
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const fetchEducation = async () => {
    try {
      const { data, error } = await supabase
        .from("education_details")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setEducation(data);
      }
    } catch (error) {
      console.error("Error fetching education:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: profile.bio,
          profile_picture_url: profile.profile_picture_url,
          cover_picture_url: profile.cover_picture_url,
          phone_number: profile.phone_number,
          links: profile.links,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  const uploadImage = async (file: File, type: 'profile' | 'cover') => {
    if (!user) return;
    
    setUploading(true);
    try {
      // Delete old image if exists
      const oldUrl = type === 'profile' ? profile?.profile_picture_url : profile?.cover_picture_url;
      if (oldUrl) {
        const oldPath = oldUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profiles')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update profile state
      if (type === 'profile') {
        setProfile(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null);
      } else {
        setProfile(prev => prev ? { ...prev, cover_picture_url: publicUrl } : null);
      }

      toast({
        title: "Success",
        description: `${type === 'profile' ? 'Profile' : 'Cover'} picture uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addLink = () => {
    if (!newLink.trim() || !profile) return;
    setProfile({
      ...profile,
      links: [...(profile.links || []), newLink.trim()],
    });
    setNewLink("");
  };

  const removeLink = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      links: (profile.links || []).filter((_, i) => i !== index),
    });
  };

  const saveEducation = async () => {
    if (!education) return;
    
    setSaving(true);
    try {
      const educationData = {
        user_id: user.id,
        degree: education.degree,
        major: education.major,
        minor: education.minor,
        graduation_year: education.graduation_year,
        gpa: education.gpa,
        achievements: education.achievements,
        certifications: education.certifications,
      };

      if (education.id) {
        const { error } = await supabase
          .from("education_details")
          .update(educationData)
          .eq("id", education.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("education_details")
          .insert([educationData])
          .select()
          .single();
        if (error) throw error;
        setEducation(data);
      }

      toast({
        title: "Success",
        description: "Education details updated successfully",
      });
    } catch (error) {
      console.error("Error saving education:", error);
      toast({
        title: "Error",
        description: "Failed to save education details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addAchievement = () => {
    if (!newAchievement.trim() || !education) return;
    setEducation({
      ...education,
      achievements: [...(education.achievements || []), newAchievement.trim()],
    });
    setNewAchievement("");
  };

  const removeAchievement = (index: number) => {
    if (!education) return;
    setEducation({
      ...education,
      achievements: education.achievements.filter((_, i) => i !== index),
    });
  };

  const addCertification = () => {
    if (!newCertification.trim() || !education) return;
    setEducation({
      ...education,
      certifications: [...(education.certifications || []), newCertification.trim()],
    });
    setNewCertification("");
  };

  const removeCertification = (index: number) => {
    if (!education) return;
    setEducation({
      ...education,
      certifications: education.certifications.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-4 bg-muted rounded"></div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Profile</h1>
          <p className="text-muted-foreground">Manage your college profile and academic details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>View your details and edit your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Non-editable fields */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="text-foreground font-medium">{profile?.full_name || "Not set"}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-foreground">{profile?.email || "Not set"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="text-foreground capitalize">{profile?.role || "Student"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="text-foreground">{profile?.department || "Not set"}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Year</Label>
                    <p className="text-foreground">
                      {profile?.year_of_study ? `${profile.year_of_study}${profile.year_of_study === 1 ? 'st' : profile.year_of_study === 2 ? 'nd' : profile.year_of_study === 3 ? 'rd' : 'th'} Year` : "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Editable Fields</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <div className="flex flex-col space-y-2">
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, 'profile');
                      }}
                      disabled={uploading}
                    />
                    {profile?.profile_picture_url && (
                      <div className="mt-2">
                        <img 
                          src={profile.profile_picture_url} 
                          alt="Profile preview" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverPicture">Cover Picture</Label>
                  <div className="flex flex-col space-y-2">
                    <Input
                      id="coverPicture"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, 'cover');
                      }}
                      disabled={uploading}
                    />
                    {profile?.cover_picture_url && (
                      <div className="mt-2">
                        <img 
                          src={profile.cover_picture_url} 
                          alt="Cover preview" 
                          className="w-full h-32 rounded-lg object-cover border-2 border-border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile?.phone_number || ""}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, phone_number: e.target.value } : null)}
                    placeholder="Your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About Me</Label>
                  <Textarea
                    id="bio"
                    value={profile?.bio || ""}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    placeholder="Tell others about yourself..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Links</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="Add a link (e.g., LinkedIn, GitHub)"
                      onKeyPress={(e) => e.key === "Enter" && addLink()}
                    />
                    <Button type="button" onClick={addLink} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile?.links?.map((link, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <LinkIcon className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{link}</span>
                        <button
                          onClick={() => removeLink(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Education Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Education Details</span>
              </CardTitle>
              <CardDescription>Your academic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  value={education?.degree || ""}
                  onChange={(e) => setEducation(prev => ({ 
                    ...prev, 
                    id: prev?.id || "",
                    degree: e.target.value,
                    major: prev?.major || "",
                    graduation_year: prev?.graduation_year || new Date().getFullYear(),
                    achievements: prev?.achievements || [],
                    certifications: prev?.certifications || []
                  }))}
                  placeholder="Bachelor's, Master's, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={education?.major || ""}
                  onChange={(e) => setEducation(prev => ({ 
                    ...prev, 
                    id: prev?.id || "",
                    degree: prev?.degree || "",
                    major: e.target.value,
                    graduation_year: prev?.graduation_year || new Date().getFullYear(),
                    achievements: prev?.achievements || [],
                    certifications: prev?.certifications || []
                  }))}
                  placeholder="Computer Science, Engineering, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minor">Minor (Optional)</Label>
                <Input
                  id="minor"
                  value={education?.minor || ""}
                  onChange={(e) => setEducation(prev => ({ 
                    ...prev, 
                    id: prev?.id || "",
                    degree: prev?.degree || "",
                    major: prev?.major || "",
                    minor: e.target.value,
                    graduation_year: prev?.graduation_year || new Date().getFullYear(),
                    achievements: prev?.achievements || [],
                    certifications: prev?.certifications || []
                  }))}
                  placeholder="Mathematics, Business, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    value={education?.graduation_year || ""}
                    onChange={(e) => setEducation(prev => ({ 
                      ...prev, 
                      id: prev?.id || "",
                      degree: prev?.degree || "",
                      major: prev?.major || "",
                      graduation_year: parseInt(e.target.value),
                      achievements: prev?.achievements || [],
                      certifications: prev?.certifications || []
                    }))}
                    placeholder="2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA (Optional)</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.01"
                    value={education?.gpa || ""}
                    onChange={(e) => setEducation(prev => ({ 
                      ...prev, 
                      id: prev?.id || "",
                      degree: prev?.degree || "",
                      major: prev?.major || "",
                      graduation_year: prev?.graduation_year || new Date().getFullYear(),
                      gpa: parseFloat(e.target.value),
                      achievements: prev?.achievements || [],
                      certifications: prev?.certifications || []
                    }))}
                    placeholder="3.75"
                  />
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-2">
                <Label>Achievements</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="Add an achievement"
                    onKeyPress={(e) => e.key === "Enter" && addAchievement()}
                  />
                  <Button type="button" onClick={addAchievement} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {education?.achievements?.map((achievement, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <Award className="h-3 w-3" />
                      <span>{achievement}</span>
                      <button
                        onClick={() => removeAchievement(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="Add a certification"
                    onKeyPress={(e) => e.key === "Enter" && addCertification()}
                  />
                  <Button type="button" onClick={addCertification} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {education?.certifications?.map((certification, index) => (
                    <Badge key={index} variant="outline" className="flex items-center space-x-1">
                      <span>{certification}</span>
                      <button
                        onClick={() => removeCertification(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={saveEducation} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Education Details"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};