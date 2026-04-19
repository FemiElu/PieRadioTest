// supabase-image-loader.js
export default function supabaseLoader({ src, width, quality }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eybfcekeksdcnimfkgkc.supabase.co';

    // NOTE: Logging is intentionally limited to development to avoid flooding the console.
    const isDev = process.env.NODE_ENV === 'development';

    // 1. Identify and Clean the Path
    let path = src;

    // If it's a Signed URL, return it as-is (we can't optimize signed URLs easily without breaking the signature)
    if (src.includes('/sign/')) {
        return src;
    }

    // If it's a full URL, strip everything before the bucket name
    if (src.includes(supabaseUrl)) {
        path = src.includes('/public/') ? src.split('/public/')[1] : src.replace(supabaseUrl, '');
        if (path.startsWith('/storage/v1/object/')) {
            path = path.replace('/storage/v1/object/', '');
        }
    }
    // If it's a relative path that still has the storage prefix, strip it
    else if (src.startsWith('/storage/v1/object/public/')) {
        path = src.replace('/storage/v1/object/public/', '');
    }
    // If it's a relative path starting with a slash, remove the leading slash
    else if (src.startsWith('/')) {
        path = src.slice(1);
    }

    // 2. Handle External Images (Unsplash, Apple Music, etc.)
    // If after cleaning it still starts with http, it's a truly external image
    if (path && path.startsWith('http')) {
        // Handle Unsplash optimization
        if (path.includes('images.unsplash.com')) {
            try {
                const urlObj = new URL(path);
                urlObj.searchParams.set('w', String(width));
                urlObj.searchParams.set('q', String(quality || 75));
                urlObj.searchParams.set('auto', 'format');
                return urlObj.toString();
            } catch {
                return `${path}${path.includes('?') ? '&' : '?'}w=${width}&q=${quality || 75}&auto=format`;
            }
        }

        // Handle Apple Music / iTunes Artwork
        // Pattern: .../100x100bb.jpg -> .../{width}x{width}bb.jpg
        if (path.includes('mzstatic.com')) {
            return path.replace(/\/\d+x\d+bb\.jpg$/, `/${width}x${width}bb.jpg`);
        }

        // Fallback for other external images: return as-is (unoptimized, but bypasses Vercel)
        if (isDev) {
            console.log('[Supabase Loader] External image (unoptimized):', path);
        }
        return path;
    }

    // 3. Detect Local Assets (public folder images)
    // If it starts with /assets/ it's definitely a local asset in our project
    if (src.startsWith('/assets/') || src.startsWith('assets/')) {
        return src.startsWith('/') ? src : `/${src}`;
    }

    // If the path doesn't contain a known Supabase bucket name, treat it as a local asset
    const knownSupabaseBuckets = ['avatars', 'images', 'news-images', 'track-submissions'];
    const bucketName = path.split('/')[0];
    
    if (!knownSupabaseBuckets.includes(bucketName)) {
        // This is a local Next.js public folder asset, return as-is
        // Next.js will serve it as a static file
        return src.startsWith('/') ? src : `/${src}`;
    }

    // 4. Construct the Final Transformation URL for Supabase Storage
    // The path at this point MUST be "bucket-name/image-name.jpg"
    return `${supabaseUrl}/storage/v1/render/image/public/${path}?width=${width}&quality=${quality || 75}&resize=contain`;
}