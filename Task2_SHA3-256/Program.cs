using System.Numerics;
using Org.BouncyCastle.Crypto.Digests;

string folderPath = @"C:\Users\basha\Downloads\task2";
string email = "basharovbmkz@gmail.com";

// Шаг 1: считаем SHA3-256 для каждого файла
var files = Directory.GetFiles(folderPath, "*.data");
Console.WriteLine($"Найдено файлов: {files.Length}");

var hashes = new List<string>();

foreach (var file in files)
{
    byte[] fileBytes = File.ReadAllBytes(file);
    
    var digest = new Sha3Digest(256);
    digest.BlockUpdate(fileBytes, 0, fileBytes.Length);
    byte[] result = new byte[32];
    digest.DoFinal(result, 0);
    
    string hex = Convert.ToHexString(result).ToLower();
    hashes.Add(hex);
}

Console.WriteLine($"Хешей вычислено: {hashes.Count}");

// Шаг 2: сортируем по произведению (цифра+1)
hashes.Sort((a, b) =>
{
    BigInteger keyA = ComputeSortKey(a);
    BigInteger keyB = ComputeSortKey(b);
    return keyA.CompareTo(keyB);
});

// Шаг 3: склеиваем + email
string concatenated = string.Concat(hashes) + email;

// Шаг 4: финальный SHA3-256
var finalDigest = new Sha3Digest(256);
byte[] strBytes = System.Text.Encoding.UTF8.GetBytes(concatenated);
finalDigest.BlockUpdate(strBytes, 0, strBytes.Length);
byte[] finalResult = new byte[32];
finalDigest.DoFinal(finalResult, 0);

string answer = Convert.ToHexString(finalResult).ToLower();
Console.WriteLine($"\nОтвет: {answer}");

static BigInteger ComputeSortKey(string hash)
{
    BigInteger product = BigInteger.One;
    foreach (char c in hash)
    {
        int digit = Convert.ToInt32(c.ToString(), 16); // 0–15
        product *= (digit + 1); // +1, чтобы не обнулять произведение
    }
    return product;
}