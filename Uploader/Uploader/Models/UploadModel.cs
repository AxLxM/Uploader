namespace Uploader.Models
{
    public class UploadModel
    {
        public string FileId { get; set; }

        public string FileName { get; set; }

        public int FileSize { get; set; }

        public string FileBytes { get; set; }

        public int Part { get; set; }
    }
}
//https://www.flaticon.com/packs/file-types?word=file%20type