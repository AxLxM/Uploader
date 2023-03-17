using System.Text;

namespace Uploader.Tools
{
    public static class StaticMethods
    {
        private static readonly string[] SizeSuffixes = { "bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB" };
        public static string SizeSuffix(Int64 value, int decimalPlaces = 1)
        {
            if (decimalPlaces < 0) { throw new ArgumentOutOfRangeException("decimalPlaces"); }
            if (value < 0) { return "-" + SizeSuffix(-value, decimalPlaces); }
            if (value == 0) { return string.Format("{0:n" + decimalPlaces + "} bytes", 0); }
            int mag = (int)Math.Log(value, 1024);
            decimal adjustedSize = (decimal)value / (1L << (mag * 10));
            if (Math.Round(adjustedSize, decimalPlaces) >= 1000)
            {
                mag += 1;
                adjustedSize /= 1024;
            }
            return string.Format("{0:n" + decimalPlaces + "} {1}", adjustedSize, SizeSuffixes[mag]);
        }

        public static void WriteLog(string path, string message)
        {
            object lockObject = new object();
            try
            {
                if (Monitor.TryEnter(lockObject, 300))
                {
                    try
                    {
                        var sw = new StreamWriter(path, true);
                        sw.WriteLine(message);
                        sw.Flush();
                        sw.Close();
                    }
                    finally
                    {
                        Monitor.Exit(lockObject);
                    }
                }
                else
                {
                }
            }
            catch
            {
            }
        }

        public static string ReadLog(string path)
        {
            var sb = new StringBuilder();
            object lockObject = new object();
            try
            {
                if (Monitor.TryEnter(lockObject, 300))
                {
                    try
                    {
                        using (StreamReader file = new StreamReader(path))
                        {
                            string ln;
                            while ((ln = file.ReadLine()) != null)
                            {
                                sb.Append(ln);
                            }
                            file.Close();
                        }
                    }
                    finally
                    {
                        Monitor.Exit(lockObject);
                    }
                }
                else
                {
                }
            }
            catch
            {
            }
            return sb.ToString();
        }

        public static void DeleteLog(string path)
        {
            object lockObject = new object();
            try
            {
                if (Monitor.TryEnter(lockObject, 300))
                {
                    try
                    {
                        File.Delete(path);
                    }
                    finally
                    {
                        Monitor.Exit(lockObject);
                    }
                }
                else
                {
                }
            }
            catch
            {
            }
        }
    }
}
