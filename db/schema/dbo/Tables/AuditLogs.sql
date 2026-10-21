CREATE TABLE [dbo].[AuditLogs] (
    [id]           UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [created_at]   DATETIME         DEFAULT (getdate()) NOT NULL,
    [user_id]      UNIQUEIDENTIFIER NULL,
    [user_display] VARCHAR (150)    NULL,
    [action]       VARCHAR (60)     NOT NULL,
    [detail]       VARCHAR (500)    NULL,
    PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

