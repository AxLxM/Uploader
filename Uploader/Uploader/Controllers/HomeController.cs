using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using Uploader.Models;

namespace Uploader.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private string _uploadBase = Path.Combine(Environment.CurrentDirectory, "wwwroot\\upload");

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            TempData["SessionId"] = HttpContext.Session.Id;
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        public IActionResult Speed()
        {
            HttpContext.Request.Headers.Add("Connection", "close");
            HttpContext.Response.Headers.Add("Connection", "close");
            return Json(true);
        }

        [HttpPost]
        public async Task<IActionResult> UploadFile(UploadModel file)
        {
            var filePath = Path.Combine(_uploadBase, $"{file.FileId}-{file.FileName}");
            var filePathTemp = $"{filePath}.tmp";
            try
            {
                if (!Directory.Exists(_uploadBase))
                    Directory.CreateDirectory(_uploadBase);

                if (!string.IsNullOrWhiteSpace(file.FileBytes))
                {
                    var msg = file.FileBytes + (file.FileBytes.Split(',').Length >= 20000 ? "," : "");
                    Tools.StaticMethods.WriteLog(filePathTemp, msg);
                }
                else
                {
                    throw new Exception();
                }
                return Json(1);
            }
            catch
            {
                if (System.IO.File.Exists(filePathTemp) && string.IsNullOrWhiteSpace(file.FileBytes))
                {
                    var strBytes = Tools.StaticMethods.ReadLog(filePathTemp);
                    if (!string.IsNullOrWhiteSpace(strBytes))
                    {
                        if (strBytes.EndsWith(","))
                            strBytes = strBytes.Substring(0, strBytes.Length - 2);
                        var bytes = strBytes.Split(',').Select(s => byte.Parse(s)).ToList();
                        using (FileStream fs = new FileStream(filePath, FileMode.Create, FileAccess.Write))
                        {
                            await fs.WriteAsync(bytes.ToArray(), 0, bytes.Count);
                        }
                    }
                    Tools.StaticMethods.DeleteLog(filePathTemp);
                    return Json(0);
                }
                return Json(-1);
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}