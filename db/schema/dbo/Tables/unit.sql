CREATE TABLE [dbo].[unit] (
    [id]               UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [name_unit]        VARCHAR (50)     NOT NULL,
    [description_unit] VARCHAR (150)    NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    UNIQUE NONCLUSTERED ([name_unit] ASC)
);


GO

