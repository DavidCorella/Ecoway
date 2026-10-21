CREATE TABLE [dbo].[PersonalData] (
    [ID]              VARCHAR (10)  NOT NULL,
    [name]            NVARCHAR (50) NOT NULL,
    [lastname]        NVARCHAR (50) NOT NULL,
    [second_Lastname] NVARCHAR (50) NOT NULL
);


GO

CREATE NONCLUSTERED INDEX [IX_PersonalData_ID]
    ON [dbo].[PersonalData]([ID] ASC);


GO

