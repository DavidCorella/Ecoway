CREATE TABLE [dbo].[physical_states] (
    [id]                        UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [Description_physicalState] VARCHAR (100)    NOT NULL,
    [name_physicalState]        VARCHAR (50)     NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    UNIQUE NONCLUSTERED ([name_physicalState] ASC)
);


GO

