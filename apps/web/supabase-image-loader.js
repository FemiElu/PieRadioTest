// supabase-image-loader.js
export default function supabaseLoader({ src, width, quality }) {
    const projectId = 'eybfcekeksdcnimfkgkc';
    const supabaseUrl = `https://${projectId}.supabase.co`;

    // CASE 1: Supabase Images (Relative Path)
    // If the src doesn't start with http, we treat it as a Supabase path
    if (!src.startsWith('http')) {
        return `${supabaseUrl}/storage/v1/render/image/public/${src}?width=${width}&quality=${quality || 75}`;
    }

    // CASE 2: Already a full Supabase URL
    // If you accidentally paste a full Supabase URL, we strip the base and optimize it anyway
    if (src.includes(supabaseUrl)) {
        const path = src.split('/public/')[1];
        return `${supabaseUrl}/storage/v1/render/image/public/${path}?width=${width}&quality=${quality || 75}`;
    }

    // CASE 3: Unsplash Optimization
    if (src.includes('images.unsplash.com')) {
        return `${src}?w=${width}&q=${quality || 75}&auto=format`;
    }

    // CASE 4: Google User Photos
    if (src.includes('googleusercontent.com')) {
        return `${src}=s${width}`; // Google uses =sXX for sizing
    }

    // CASE 5: Everything else (Apple, GitHub, etc.)
    // Just return the original URL (no optimization)
    return src;
}