using DATA_Task1_parseBook;

class Program 
{
    static void Main(string[] args)
    {
        var parser = new Parser();
        var result= parser.ParseBook(@"C:\Users\basha\RiderProjects\Itransition\DATA_Task1_parseBook\task1_d.json");
        
        var db = new Database("Host=localhost;Database=books_db;Username=postgres;Password=123;");
        
        db.CreateTable();
        db.InsertBook(result);
        db.CreateSummary();
    }
}

