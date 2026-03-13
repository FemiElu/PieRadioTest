// supabase-image-loader.js
export default function supabaseLoader({ src, width, quality }) {
    const projectId = 'eybfcekeksdcnimfkgkc';
    const supabaseUrl = `https://${projectId}.supabase.co`;

    // 1. Identify and Clean the Path
    let path = src;

    // If it's a full URL, strip everything before the bucket name
    if (src.includes(supabaseUrl)) {
        path = src.split('/public/')[1];
    }
    // If it's a relative path that still has the storage prefix, strip it
    else if (src.startsWith('/storage/v1/object/public/')) {
        path = src.replace('/storage/v1/object/public/', '');
    }
    // If it's a relative path starting with a slash, remove the leading slash
    else if (src.startsWith('/')) {
        path = src.slice(1);
    }

    // 2. Handle External Images (Unsplash, Google, etc.)
    // If after cleaning it still starts with http, it's a truly external image
    if (path.startsWith('http')) {
        // Optional: Add Unsplash optimization
        if (path.includes('images.unsplash.com')) {
            return `${path}?w=${width}&q=${quality || 75}&auto=format`;
        }
        return path;
    }

    // 3. Construct the Final Transformation URL
    // The path at this point MUST be "bucket-name/image-name.jpg"
    return `${supabaseUrl}/storage/v1/render/image/public/${path}?width=${width}&quality=${quality || 75}`;
}