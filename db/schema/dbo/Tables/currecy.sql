CREATE TABLE [dbo].[currecy] (
    [id]            UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [name_currency] VARCHAR (20)     NOT NULL,
    [price]         DECIMAL (18, 2)  NOT NULL,
    [dateUpdate]    DATETIME         DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    UNIQUE NONCLUSTERED ([name_currency] ASC)
);


GO

