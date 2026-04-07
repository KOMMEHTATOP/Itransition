using DATA_Task1_parseBook;

class Program 
{
    static void Main(string[] args)
    {
        var parser = new Parser();
        var result= parser.ParseBook(@"C:\Users\basha\RiderProjects\Itransition\DATA_Task1_parseBook\task1_d.json");
        foreach (var item in result)
        {
            Console.WriteLine($"{item.Title} - {item.Author} - {item.Publisher} - {item.Year} -  {item.Price}");
        }
    }
    
}

