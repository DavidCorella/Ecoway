CREATE TABLE [dbo].[Nationality] (
    [optionsNationality] INT              IDENTITY (1, 1) NOT NULL,
    [PublicId]           UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [name]               VARCHAR (100)    NOT NULL,
    PRIMARY KEY CLUSTERED ([PublicId] ASC),
    UNIQUE NONCLUSTERED ([optionsNationality] ASC)
);


GO

