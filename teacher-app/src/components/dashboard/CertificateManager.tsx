import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Award, Plus, Upload, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  verification_id?: string;
  user_id: string;
}

interface CertificateManagerProps {
  certificates: Certificate[];
  onCertificatesChange: (certificates: Certificate[]) => void;
  userId: string;
}

export const CertificateManager = ({ certificates, onCertificatesChange, userId }: CertificateManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    verification_id: '',
    certificate_url: ''
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      title: '',
      issuer: '',
      issue_date: '',
      expiry_date: '',
      verification_id: '',
      certificate_url: ''
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please upload an image or PDF file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `certificates/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, certificate_url: data.publicUrl }));
      
      toast({
        title: "Success",
        description: "Certificate uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload certificate",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.issuer || !formData.issue_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          title: formData.title,
          issuer: formData.issuer,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date || null,
          verification_id: formData.verification_id || null,
          certificate_url: formData.certificate_url || null,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      onCertificatesChange([...certificates, data]);
      toast({
        title: "Success",
        description: "Certificate added successfully"
      });
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding certificate:', error);
      toast({
        title: "Error",
        description: "Failed to add certificate",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (certificateId: string) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certificateId);

      if (error) throw error;

      const updatedCertificates = certificates.filter(cert => cert.id !== certificateId);
      onCertificatesChange(updatedCertificates);
      
      toast({
        title: "Success",
        description: "Certificate deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast({
        title: "Error",
        description: "Failed to delete certificate",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="space-y-3">
        {certificates.length > 0 ? (
          certificates.map((cert) => (
            <div key={cert.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg group">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{cert.title}</p>
                <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                <p className="text-xs text-muted-foreground">
                  Issued: {new Date(cert.issue_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {cert.certificate_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(cert.certificate_url, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No certificates yet</p>
          </div>
        )}
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Certificate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Certificate Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., AWS Cloud Practitioner"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="issuer">Issuer *</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                  placeholder="e.g., Amazon Web Services"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issue_date">Issue Date *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="verification_id">Verification ID</Label>
                <Input
                  id="verification_id"
                  value={formData.verification_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, verification_id: e.target.value }))}
                  placeholder="Enter verification code"
                />
              </div>

              <div>
                <Label htmlFor="certificate_file">Certificate Image/PDF</Label>
                <div className="mt-2">
                  <Input
                    id="certificate_file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                  )}
                  {formData.certificate_url && (
                    <p className="text-sm text-green-600 mt-1">File uploaded successfully</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  Add Certificate
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};