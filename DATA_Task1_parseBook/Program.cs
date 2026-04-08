namespace DATA_Task1_parseBook;

class Program
{
    static void Main(string[] args)
    {
        var parser = new Parser();
        var result = parser.ParseBook(args[0]);

        var db = new Database(args[1]);

        db.CreateTable();
        db.InsertBook(result);
        db.CreateSummary();
    }
}