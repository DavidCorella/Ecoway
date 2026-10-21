CREATE TABLE [dbo].[PersonalDataForeign] (
    [id]      UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [user_id] VARCHAR (30)     NOT NULL,
    [name]    VARCHAR (150)    NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

