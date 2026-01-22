export const validateRequest = (
    artist: string,
    song: string,
    stationId: number
) => {
    const errors: Record<string, string[]> = {};
    if (!artist.trim()) errors.artist_name = ['Artist name is required'];
    if (!song.trim()) errors.song_title = ['Song title is required'];
    if (!stationId || stationId <= 0) errors.station_id = ['Invalid station ID'];

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
