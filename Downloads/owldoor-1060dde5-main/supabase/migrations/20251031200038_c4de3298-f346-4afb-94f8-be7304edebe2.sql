-- Drop existing policies on blog_posts
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Staff can manage all blog posts" ON blog_posts;

-- Staff can create and edit blog posts (but only as drafts)
CREATE POLICY "Staff can create draft blog posts"
ON blog_posts
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'staff'::app_role) AND
  status = 'draft'
);

CREATE POLICY "Staff can update their own draft blog posts"
ON blog_posts
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'staff'::app_role) AND
  status = 'draft'
)
WITH CHECK (
  has_role(auth.uid(), 'staff'::app_role) AND
  status = 'draft'
);

CREATE POLICY "Staff can delete draft blog posts"
ON blog_posts
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'staff'::app_role) AND
  status = 'draft'
);

-- Only admins can publish blog posts
CREATE POLICY "Admins can manage all blog posts"
ON blog_posts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view published blog posts
CREATE POLICY "Anyone can view published blog posts"
ON blog_posts
FOR SELECT
USING (status = 'published');

-- Staff can view all blog posts (including drafts)
CREATE POLICY "Staff can view all blog posts"
ON blog_posts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role));