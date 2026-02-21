export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_panel_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          announcement_type: string
          audience: string[] | null
          content: string
          created_at: string
          created_by: string
          id: string
          institution_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          announcement_type: string
          audience?: string[] | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          institution_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          announcement_type?: string
          audience?: string[] | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          institution_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          request_type: string
          requested_by: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          request_type: string
          requested_by?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          request_type?: string
          requested_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          marked_by: string
          remarks: string | null
          schedule_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          marked_by: string
          remarks?: string | null
          schedule_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          marked_by?: string
          remarks?: string | null
          schedule_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      authority_audit_log: {
        Row: {
          action_type: string
          authority_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          authority_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          authority_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_status: string
          created_at: string
          event_id: string
          id: string
          payment_id: string | null
          payment_status: string | null
          seat_numbers: string[] | null
          seats_booked: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date?: string
          booking_status?: string
          created_at?: string
          event_id: string
          id?: string
          payment_id?: string | null
          payment_status?: string | null
          seat_numbers?: string[] | null
          seats_booked: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_status?: string
          created_at?: string
          event_id?: string
          id?: string
          payment_id?: string | null
          payment_status?: string | null
          seat_numbers?: string[] | null
          seats_booked?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_events: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          current_participants: number | null
          description: string
          event_date: string
          id: string
          image_url: string | null
          institution_id: string | null
          is_active: boolean | null
          location: string
          max_participants: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          current_participants?: number | null
          description: string
          event_date: string
          id?: string
          image_url?: string | null
          institution_id?: string | null
          is_active?: boolean | null
          location: string
          max_participants?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          current_participants?: number | null
          description?: string
          event_date?: string
          id?: string
          image_url?: string | null
          institution_id?: string | null
          is_active?: boolean | null
          location?: string
          max_participants?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_events_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string
          title: string
          user_id: string | null
          verification_id: string | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer: string
          title: string
          user_id?: string | null
          verification_id?: string | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string
          title?: string
          user_id?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "connections_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          institution_id: string | null
          last_message_at: string | null
          participant1_id: string
          participant2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id?: string | null
          last_message_at?: string | null
          participant1_id: string
          participant2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string | null
          last_message_at?: string | null
          participant1_id?: string
          participant2_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      education_details: {
        Row: {
          achievements: string[] | null
          certifications: string[] | null
          created_at: string
          degree: string
          gpa: number | null
          graduation_year: number
          id: string
          major: string
          minor: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string[] | null
          certifications?: string[] | null
          created_at?: string
          degree: string
          gpa?: number | null
          graduation_year: number
          id?: string
          major: string
          minor?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string[] | null
          certifications?: string[] | null
          created_at?: string
          degree?: string
          gpa?: number | null
          graduation_year?: number
          id?: string
          major?: string
          minor?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          available_seats: number | null
          base_price: number
          category: string
          created_at: string
          description: string
          event_date: string
          event_time: string
          id: string
          image_url: string | null
          is_active: boolean | null
          max_price: number | null
          rating: number | null
          title: string
          total_seats: number | null
          updated_at: string
          venue_location: string
          venue_name: string
        }
        Insert: {
          available_seats?: number | null
          base_price: number
          category: string
          created_at?: string
          description: string
          event_date: string
          event_time: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_price?: number | null
          rating?: number | null
          title: string
          total_seats?: number | null
          updated_at?: string
          venue_location: string
          venue_name: string
        }
        Update: {
          available_seats?: number | null
          base_price?: number
          category?: string
          created_at?: string
          description?: string
          event_date?: string
          event_time?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_price?: number | null
          rating?: number | null
          title?: string
          total_seats?: number | null
          updated_at?: string
          venue_location?: string
          venue_name?: string
        }
        Relationships: []
      }
      experience: {
        Row: {
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mentoring_relationships: {
        Row: {
          created_at: string | null
          id: string
          mentee_id: string | null
          mentor_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentee_id?: string | null
          mentor_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentee_id?: string | null
          mentor_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentoring_relationships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentoring_relationships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string | null
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_id: string | null
          action_type: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id?: string | null
          action_type?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string | null
          action_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          audience: string[] | null
          author_id: string
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          institution_id: string | null
          likes_count: number | null
          updated_at: string
        }
        Insert: {
          audience?: string[] | null
          author_id: string
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          institution_id?: string | null
          likes_count?: number | null
          updated_at?: string
        }
        Update: {
          audience?: string[] | null
          author_id?: string
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          institution_id?: string | null
          likes_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          branch: string | null
          connections_count: number | null
          Course: string | null
          cover_picture_url: string | null
          created_at: string
          daily_streak: number | null
          department: string
          email: string
          full_name: string
          id: string
          institution_id: string | null
          institution_roll_number: string | null
          last_activity_date: string | null
          links: string[] | null
          phone_number: string | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          section: string | null
          student_id: string | null
          updated_at: string
          user_id: string
          year_of_study: number | null
        }
        Insert: {
          bio?: string | null
          branch?: string | null
          connections_count?: number | null
          Course?: string | null
          cover_picture_url?: string | null
          created_at?: string
          daily_streak?: number | null
          department: string
          email: string
          full_name: string
          id?: string
          institution_id?: string | null
          institution_roll_number?: string | null
          last_activity_date?: string | null
          links?: string[] | null
          phone_number?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          section?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
          year_of_study?: number | null
        }
        Update: {
          bio?: string | null
          branch?: string | null
          connections_count?: number | null
          Course?: string | null
          cover_picture_url?: string | null
          created_at?: string
          daily_streak?: number | null
          department?: string
          email?: string
          full_name?: string
          id?: string
          institution_id?: string | null
          institution_roll_number?: string | null
          last_activity_date?: string | null
          links?: string[] | null
          phone_number?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          section?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          demo_url: string | null
          description: string
          end_date: string | null
          github_url: string | null
          id: string
          image_url: string | null
          start_date: string | null
          status: string | null
          technologies: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          description: string
          end_date?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          start_date?: string | null
          status?: string | null
          technologies?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          description?: string
          end_date?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          start_date?: string | null
          status?: string | null
          technologies?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          downloads_count: number | null
          file_size: number | null
          file_url: string
          id: string
          institution_id: string | null
          rating: number | null
          resource_type: string
          subject: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          downloads_count?: number | null
          file_size?: number | null
          file_url: string
          id?: string
          institution_id?: string | null
          rating?: number | null
          resource_type?: string
          subject: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          downloads_count?: number | null
          file_size?: number | null
          file_url?: string
          id?: string
          institution_id?: string | null
          rating?: number | null
          resource_type?: string
          subject?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rating: number
          review_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rating: number
          review_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          review_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string
          day_of_week: number
          end_time: string
          id: string
          institution_id: string | null
          room_location: string | null
          start_time: string
          subject: string
          target_branch: string | null
          target_department: string | null
          target_section: string | null
          target_year: number | null
          teacher_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          day_of_week: number
          end_time: string
          id?: string
          institution_id?: string | null
          room_location?: string | null
          start_time: string
          subject: string
          target_branch?: string | null
          target_department?: string | null
          target_section?: string | null
          target_year?: number | null
          teacher_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          day_of_week?: number
          end_time?: string
          id?: string
          institution_id?: string | null
          room_location?: string | null
          start_time?: string
          subject?: string
          target_branch?: string | null
          target_department?: string | null
          target_section?: string | null
          target_year?: number | null
          teacher_name?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          endorsed_count: number | null
          id: string
          proficiency_level: string | null
          skill_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endorsed_count?: number | null
          id?: string
          proficiency_level?: string | null
          skill_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          endorsed_count?: number | null
          id?: string
          proficiency_level?: string | null
          skill_name?: string
          user_id?: string
        }
        Relationships: []
      }
      study_groups: {
        Row: {
          created_at: string
          created_by: string
          current_members: number | null
          description: string | null
          difficulty: string
          id: string
          image_url: string | null
          institution_id: string | null
          is_active: boolean
          location: string | null
          max_members: number | null
          meeting_schedule: string | null
          name: string
          subject: string
          tags: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_members?: number | null
          description?: string | null
          difficulty?: string
          id?: string
          image_url?: string | null
          institution_id?: string | null
          is_active?: boolean
          location?: string | null
          max_members?: number | null
          meeting_schedule?: string | null
          name: string
          subject: string
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_members?: number | null
          description?: string | null
          difficulty?: string
          id?: string
          image_url?: string | null
          institution_id?: string | null
          is_active?: boolean
          location?: string | null
          max_members?: number | null
          meeting_schedule?: string | null
          name?: string
          subject?: string
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          amenities: string[] | null
          capacity: number
          city: string
          created_at: string
          id: string
          name: string
          seat_layout: Json | null
          state: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          capacity: number
          city: string
          created_at?: string
          id?: string
          name: string
          seat_layout?: Json | null
          state: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          capacity?: number
          city?: string
          created_at?: string
          id?: string
          name?: string
          seat_layout?: Json | null
          state?: string
        }
        Relationships: []
      }
      work_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_connection_request: {
        Args: { request_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_action_id?: string
          p_action_type?: string
          p_created_by?: string
          p_description: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      decrement_connections_count: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      get_attendance_stats: {
        Args: { p_days?: number; p_student_id: string }
        Returns: {
          absent_count: number
          attendance_percentage: number
          late_count: number
          present_count: number
          total_classes: number
        }[]
      }
      get_discovery_profiles: {
        Args: { search_term?: string }
        Returns: {
          bio: string
          department: string
          full_name: string
          institution_id: string
          is_connected: boolean
          profile_picture_url: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
          year_of_study: number
        }[]
      }
      get_limited_profile_info: {
        Args: { target_user_id: string }
        Returns: {
          bio: string
          department: string
          full_name: string
          profile_picture_url: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
          year_of_study: number
        }[]
      }
      get_original_protected_fields: {
        Args: { target_user_id: string }
        Returns: {
          department: string
          email: string
          full_name: string
          institution_id: string
          institution_roll_number: string
          role: Database["public"]["Enums"]["user_role"]
          student_id: string
          year_of_study: number
        }[]
      }
      get_profile_institution_id: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_public_profile_info: {
        Args: { profile_user_id: string }
        Returns: {
          bio: string
          department: string
          full_name: string
          id: string
          institution_id: string
          profile_picture_url: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
          year_of_study: number
        }[]
      }
      get_user_institution_id: { Args: never; Returns: string }
      has_group_role: {
        Args: { gid: string; required_role?: string; uid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          check_user_id: string
        }
        Returns: boolean
      }
      log_authority_action: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_target_user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "authority" | "teacher" | "mentor" | "student"
      user_role: "student" | "mentor" | "teacher" | "authority"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "authority", "teacher", "mentor", "student"],
      user_role: ["student", "mentor", "teacher", "authority"],
    },
  },
} as const
