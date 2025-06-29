import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { EditableField } from './EditableField';
import { ContactService, UserProfileService } from '../services/portfolioDataService';
import { toast } from 'sonner';

interface ContactSectionProps {
  isEditMode: boolean;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ isEditMode }) => {
  const [contactInfo, setContactInfo] = useState({
    phone: '+1 (555) 123-4567',
    email: 'vaishnavi@upadhyaydesign.com',
    address: '123 Design Street, Creative District, NY 10001',
    hours: 'Mon - Fri: 9:00 AM - 6:00 PM'
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateContactInfo = async (field: keyof typeof contactInfo, value: string) => {
    if (!isEditMode) return;
    
    try {
      // Save to database
      await UserProfileService.saveProfileField(field, value);
      
      // Update local state
      setContactInfo(prev => ({
        ...prev,
        [field]: value
      }));
      
      toast.success(`${field} updated successfully!`);
    } catch (error) {
      console.error('Failed to update contact info:', error);
      toast.error(`Failed to update ${field}. Please try again.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await ContactService.submitInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        subject: 'Portfolio Contact Form'
      });
      
      toast.success('Thank you for your message! I will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <section id="contact" className="py-20 px-4 bg-gradient-to-br from-warm-beige to-cream-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-playfair font-bold text-primary-brown mb-6">
            Get In Touch
          </h2>
          <p className="text-xl text-text-light max-w-3xl mx-auto font-inter">
            Ready to transform your space? Let's discuss your vision and bring it to life.
          </p>
        </div>

        {isEditMode && (
          <div className="flex items-center justify-center mb-8">
            <div className="px-4 py-2 bg-primary-brown/10 text-primary-brown rounded-lg font-poppins">
              Edit Mode Active - Contact information can be edited
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8 animate-fade-in-left">
            <Card className="bg-card-gradient border-0 shadow-xl hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl font-playfair text-primary-brown flex items-center gap-3">
                  <Phone className="text-accent-gold" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EditableField
                  value={contactInfo.phone}
                  onSave={(value) => updateContactInfo('phone', value)}
                  className="text-lg text-text-dark font-inter"
                  isEditMode={isEditMode}
                  placeholder="Phone Number"
                  elementId="contact_phone"
                  elementType="contact"
                />
              </CardContent>
            </Card>

            <Card className="bg-card-gradient border-0 shadow-xl hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl font-playfair text-primary-brown flex items-center gap-3">
                  <Mail className="text-accent-gold" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EditableField
                  value={contactInfo.email}
                  onSave={(value) => updateContactInfo('email', value)}
                  className="text-lg text-text-dark font-inter"
                  isEditMode={isEditMode}
                  placeholder="Email Address"
                  elementId="contact_email"
                  elementType="contact"
                />
              </CardContent>
            </Card>

            <Card className="bg-card-gradient border-0 shadow-xl hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl font-playfair text-primary-brown flex items-center gap-3">
                  <MapPin className="text-accent-gold" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EditableField
                  value={contactInfo.address}
                  onSave={(value) => updateContactInfo('address', value)}
                  className="text-lg text-text-dark font-inter"
                  isEditMode={isEditMode}
                  multiline
                  placeholder="Business Address"
                  elementId="contact_address"
                  elementType="contact"
                />
              </CardContent>
            </Card>

            <Card className="bg-card-gradient border-0 shadow-xl hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl font-playfair text-primary-brown flex items-center gap-3">
                  <Clock className="text-accent-gold" />
                  Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EditableField
                  value={contactInfo.hours}
                  onSave={(value) => updateContactInfo('hours', value)}
                  className="text-lg text-text-dark font-inter"
                  isEditMode={isEditMode}
                  placeholder="Business Hours"
                  elementId="contact_hours"
                  elementType="contact"
                />
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="animate-fade-in-right">
            <Card className="bg-card-gradient border-0 shadow-xl hover-lift">
              <CardHeader>
                <CardTitle className="text-3xl font-playfair text-primary-brown text-center">
                  Send a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input
                      type="text"
                      placeholder="Your Name *"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-white/70 border-primary-brown/20 focus:border-primary-brown text-lg py-3"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email *"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-white/70 border-primary-brown/20 focus:border-primary-brown text-lg py-3"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Your Phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-white/70 border-primary-brown/20 focus:border-primary-brown text-lg py-3"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Tell me about your project... *"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="bg-white/70 border-primary-brown/20 focus:border-primary-brown text-lg min-h-[120px] resize-none"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary-brown to-secondary-brown hover:scale-105 transition-all duration-300 font-poppins text-lg py-3"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-10 w-16 h-16 bg-accent-gold/20 rounded-full animate-floating-slow"></div>
        <div className="absolute bottom-10 left-10 w-20 h-20 bg-primary-brown/10 rounded-full animate-floating-medium"></div>
      </div>
    </section>
  );
};