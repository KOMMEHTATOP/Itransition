using DATA_Task1_parseBook.Model;
using Npgsql;

namespace DATA_Task1_parseBook;

public class Database
{
    private readonly string _connectionString;
    public Database(string connectionString)
    {
        _connectionString = connectionString;
    }

    public void CreateTable()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();
    
        using var command = new NpgsqlCommand(@"
        CREATE TABLE IF NOT EXISTS books (
            id NUMERIC PRIMARY KEY,
            title TEXT,
            author TEXT,
            genre TEXT,
            publisher TEXT,
            year INTEGER,
            price TEXT
        );", connection);
        command.ExecuteNonQuery();
    }

    public void InsertBook(List<Book> books)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        foreach (var book in books)
        {
            using var command = new NpgsqlCommand(@"
            INSERT INTO books (id, title, author, genre, publisher, year, price)
            VALUES (@id, @title, @author, @genre, @publisher, @year, @price)", connection);
            
            command.Parameters.AddWithValue("@id", book.Id);
            command.Parameters.AddWithValue("@title", book.Title);
            command.Parameters.AddWithValue("@author", book.Author);
            command.Parameters.AddWithValue("@genre", book.Genre);
            command.Parameters.AddWithValue("@publisher", book.Publisher);
            command.Parameters.AddWithValue("@year", book.Year);
            command.Parameters.AddWithValue("@price", book.Price);
            
            command.ExecuteNonQuery();
        }
    }
    
    public void CreateSummary()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();
        
        using var command = new NpgsqlCommand(@"
        CREATE TABLE IF NOT EXISTS summary AS
            SELECT
                year,
                count(*) as book_count,
                ROUND(AVG(
                    CASE
                        WHEN LEFT(price, 1) = '$' THEN SUBSTRING(price, 2):: numeric
                        WHEN LEFT(price, 1) = '€' THEN SUBSTRING(price, 2):: numeric*1.2
                    END), 
                    2) AS average_price
                FROM books
                GROUP BY year
                ORDER BY year;", connection);
        command.ExecuteNonQuery();
    }
}