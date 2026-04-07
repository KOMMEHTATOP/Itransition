using System.Text.Json;
using System.Text.RegularExpressions;
using DATA_Task1_parseBook.Model;

namespace DATA_Task1_parseBook;

public class Parser
{
    public List<Book> ParseBook(string filePath)
    {
        string content = File.ReadAllText(filePath);

        content = Regex.Replace(content, @":(\w+)=>", "\"$1\":");
        content = Regex.Replace(content, @",\s*]", "]");

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        return JsonSerializer.Deserialize<List<Book>>(content, options) ?? [];
    }
}