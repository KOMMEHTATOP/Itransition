namespace InventoryApi.Common;

public enum ResultStatus
{
    Ok,
    NotFound,
    Unauthorized,
    Conflict,
    Invalid,
    Error,
    Forbidden,
}

public class Result
{
    public bool IsSuccess  { get;}
    public ResultStatus Status { get; }
    public string? Error { get;}

    protected Result(bool isSuccess, ResultStatus resultStatus,  string? error)
    {
        IsSuccess = isSuccess;
        Status = resultStatus;
        Error = error;
    }

    public static Result Success()
    {
        return new Result(true, ResultStatus.Ok, null);
    }

    public static Result Failure(ResultStatus resultStatus, string? error)
    {
        return new Result(false, resultStatus, error);
    }
}

public class Result<T> : Result  
{
    public T? Value { get; }
    
    public Result(bool isSuccess, ResultStatus resultStatus, string? error, T? value) : base(isSuccess, resultStatus, error)
    {
        Value = value;
    }

    public static Result<T> Success(T value)
    {
        return new Result<T>(true, ResultStatus.Ok, null, value);
    }

    public new static Result<T> Failure(ResultStatus resultStatus, string? error)
    {
        return new Result<T>(false, resultStatus, error, default);
    }
}