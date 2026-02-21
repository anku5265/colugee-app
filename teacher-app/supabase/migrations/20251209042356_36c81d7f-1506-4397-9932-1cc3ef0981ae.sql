-- Create a function to delete all user-related data before the profile is deleted
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's posts and related data
  DELETE FROM post_likes WHERE user_id = OLD.user_id;
  DELETE FROM post_comments WHERE author_id = OLD.user_id;
  DELETE FROM posts WHERE author_id = OLD.user_id;
  
  -- Delete user's resources
  DELETE FROM resources WHERE user_id = OLD.user_id;
  
  -- Delete user's connections and requests
  DELETE FROM connections WHERE user1_id = OLD.user_id OR user2_id = OLD.user_id;
  DELETE FROM connection_requests WHERE sender_id = OLD.user_id OR receiver_id = OLD.user_id;
  
  -- Delete user's conversations and messages
  DELETE FROM messages WHERE sender_id = OLD.user_id;
  DELETE FROM conversations WHERE participant1_id = OLD.user_id OR participant2_id = OLD.user_id;
  
  -- Delete user's notifications
  DELETE FROM notifications WHERE user_id = OLD.user_id;
  
  -- Delete user's skills, experience, education, projects
  DELETE FROM skills WHERE user_id = OLD.user_id;
  DELETE FROM experience WHERE user_id = OLD.user_id;
  DELETE FROM education_details WHERE user_id = OLD.user_id;
  DELETE FROM projects WHERE user_id = OLD.user_id;
  
  -- Delete user's certificates
  DELETE FROM certificates WHERE user_id = OLD.id;
  
  -- Delete user's group memberships
  DELETE FROM group_memberships WHERE user_id = OLD.user_id;
  
  -- Delete study groups created by user
  DELETE FROM study_groups WHERE created_by = OLD.user_id;
  
  -- Delete campus events created by user
  DELETE FROM campus_events WHERE created_by = OLD.user_id;
  
  -- Delete announcements created by user
  DELETE FROM announcements WHERE created_by = OLD.user_id;
  
  -- Delete work assignments
  DELETE FROM work_assignments WHERE assigned_by = OLD.id OR assigned_to = OLD.id;
  
  -- Delete approval requests
  DELETE FROM approval_requests WHERE requested_by = OLD.id OR assigned_to = OLD.id;
  
  -- Delete mentoring relationships
  DELETE FROM mentoring_relationships WHERE mentor_id = OLD.id OR mentee_id = OLD.id;
  
  -- Delete user roles
  DELETE FROM user_roles WHERE user_id = OLD.user_id;
  
  -- Delete bookings and reviews
  DELETE FROM bookings WHERE user_id = OLD.user_id;
  DELETE FROM reviews WHERE user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- Create trigger to run before profile deletion
DROP TRIGGER IF EXISTS cleanup_user_data_trigger ON profiles;
CREATE TRIGGER cleanup_user_data_trigger
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_data();