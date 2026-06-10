## 32. Supabase Storage Buckets & Assets Architecture

This section documents the Supabase Storage architecture, bucket folder structures, file name mapping algorithms, and security policies.

---

### 32.1 Storage Buckets Configuration
The system uses two main buckets in Supabase Storage to store uploaded images:

1. **`warranty_images`**: Houses invoice receipts and warranty cards.
2. **`product_images`**: Houses equipment intake and bench check photos.

Both buckets are configured as **private** buckets by default. Image access tokens are generated using temporary pre-signed URLs (valid for 60 minutes) to prevent unauthorized image exposure.

---

### 32.2 Folder Hierarchy and Naming Convention
To prevent collisions, uploaded files are organized into structured directories matching the database keys:

$$\text{Path: } \langle\text{shop\_id}\rangle/\langle\text{job\_id}\rangle/\langle\text{product\_id}\rangle/\langle\text{timestamp}\rangle\_\langle\text{original\_name}\rangle$$

- **`shop_id`**: Restricts file context to the tenant organization.
- **`job_id`**: Links assets directly to the parent job card.
- **`product_id`**: Links assets to the specific camera gear.
- **`timestamp`**: Prefixed using `Date.now()` to guarantee uniqueness for multiple files uploaded at the same time.

---

### 32.3 Storage Access Security Policies

Every storage transaction is checked against RLS-like storage policies inside the `storage.objects` table:

#### 32.3.1 Read Access Policy (`select_objects_policy`)
- **Statement**: Allows authenticated users belonging to the same shop to read images.
- **SQL Definition**:
  ```sql
  CREATE POLICY select_objects_policy ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id IN ('warranty_images', 'product_images')
      AND (
        (substring(name from '^[^/]+') = (SELECT shop_id::text FROM profiles WHERE id = auth.uid()))
      )
    );
  ```

#### 32.3.2 Write/Upload Access Policy (`insert_objects_policy`)
- **Statement**: Allows authenticated staff (Super Admins, Managers, and Incharges) to upload images to their shop's folder.
- **SQL Definition**:
  ```sql
  CREATE POLICY insert_objects_policy ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id IN ('warranty_images', 'product_images')
      AND (substring(name from '^[^/]+') = (SELECT shop_id::text FROM profiles WHERE id = auth.uid()))
      AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager', 'service_incharge')
    );
  ```

#### 32.3.3 Delete Access Policy (`delete_objects_policy`)
- **Statement**: Allows only Super Admins and Service Managers to delete images.
- **SQL Definition**:
  ```sql
  CREATE POLICY delete_objects_policy ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id IN ('warranty_images', 'product_images')
      AND (substring(name from '^[^/]+') = (SELECT shop_id::text FROM profiles WHERE id = auth.uid()))
      AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager')
    );
  ```
