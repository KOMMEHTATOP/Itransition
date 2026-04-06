string[] testArgs = { "ABCDEFZ", "WBCDXYZ" }; // ожидается: BCD
string[] testArgs1 = { "132", "12332", "12312" }; // ожидается: 1 (или 2, или 3 — любой одиночный символ)
string[] testArgs2 = { "ABCDEFGH", "ABCDEFG", "ABCDEF", "ABCDE" }; // ожидается: ABCDE
string[] testArgs3 = { }; // пустой массив
string[] testArgs4 = { "ABCDEFGH" }; // одна строка
string[] testArgs5 = { "ABCDEFGH", "1234" }; // нет общих символов
string[] testArgs6 = { "ABCQEFDEFGHIJ", "BCXEFGYZBCDEWEFGHU" }; // ожидается: EFGH

string finalResult = FindLongestCommonSubstring(testArgs6);
Console.WriteLine(finalResult);

string FindLongestCommonSubstring(string[] inputStrings)
{
    if (inputStrings.Length == 0)
    {
        return "";
    }

    string minWord = inputStrings[0];
    foreach (var word in inputStrings)
    {
        if (word.Length < minWord.Length)
        {
            minWord = word;
        }
    }

    string result = "";
    for (int i = 0; i < minWord.Length; i++)
    {
        for (int j = i + 1; j <= minWord.Length; j++)
        {
            string subString = minWord.Substring(i, j - i);

            bool found = true;
            foreach (var word in inputStrings)
            {
                if (!word.Contains(subString))
                {
                    found = false;
                    break;
                }
            }

            if (found && subString.Length > result.Length)
            {
                result = subString;
            }
        }
    }

    return result;
}