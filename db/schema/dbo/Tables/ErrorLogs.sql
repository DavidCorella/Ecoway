CREATE TABLE [dbo].[ErrorLogs] (
    [id]          UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [created_at]  DATETIME         DEFAULT (getdate()) NOT NULL,
    [message]     VARCHAR (1000)   NOT NULL,
    [source]      VARCHAR (300)    NULL,
    [stack_trace] VARCHAR (MAX)    NULL,
    [status_code] INT              NULL,
    PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

