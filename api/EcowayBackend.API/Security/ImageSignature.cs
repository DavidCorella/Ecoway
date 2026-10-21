namespace EcowayBackend.API.Security
{
    // Revisa los primeros bytes del archivo para confirmar que de verdad
    // es una imagen del tipo que dice la extension, no solo un archivo
    // renombrado a .jpg
    public static class ImageSignature
    {
        public static async Task<bool> MatchesExtension(IFormFile file, string extension)
        {
            var header = new byte[12];

            await using var stream = file.OpenReadStream();
            var read = await stream.ReadAsync(header.AsMemory(0, header.Length));

            if (read < 4)
                return false;

            return extension switch
            {
                ".jpg" or ".jpeg" =>
                    header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,

                ".png" =>
                    header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47,

                ".webp" =>
                    read >= 12 &&
                    header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
                    header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50,

                _ => false,
            };
        }
    }
}
