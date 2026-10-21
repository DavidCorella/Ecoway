CREATE TABLE [dbo].[classify] (
    [id]                   UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [Description_classify] VARCHAR (150)    NOT NULL,
    [name_classify]        VARCHAR (50)     NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    UNIQUE NONCLUSTERED ([name_classify] ASC)
);


GO

