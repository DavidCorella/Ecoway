CREATE TABLE [dbo].[Materials] (
    [id]                   UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [Description_Material] VARCHAR (150)    NOT NULL,
    [physical_state]       UNIQUEIDENTIFIER NOT NULL,
    [currecncy]            UNIQUEIDENTIFIER NOT NULL,
    [classify]             UNIQUEIDENTIFIER NOT NULL,
    [unit]                 UNIQUEIDENTIFIER NOT NULL,
    [price]                DECIMAL (10, 2)  NOT NULL,
    [max_management_days]  INT              NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [CK_Materials_MaxManagementDays] CHECK ([max_management_days] IS NULL OR [max_management_days]>(0)),
    CONSTRAINT [FK_Materials_Classify] FOREIGN KEY ([classify]) REFERENCES [dbo].[classify] ([id]),
    CONSTRAINT [FK_Materials_Currency] FOREIGN KEY ([currecncy]) REFERENCES [dbo].[currecy] ([id]),
    CONSTRAINT [FK_Materials_PhysicalState] FOREIGN KEY ([physical_state]) REFERENCES [dbo].[physical_states] ([id]),
    CONSTRAINT [FK_Materials_Unit] FOREIGN KEY ([unit]) REFERENCES [dbo].[unit] ([id]),
    UNIQUE NONCLUSTERED ([Description_Material] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Materials_classify]
    ON [dbo].[Materials]([classify] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Materials_physical_state]
    ON [dbo].[Materials]([physical_state] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Materials_unit]
    ON [dbo].[Materials]([unit] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Materials_currecncy]
    ON [dbo].[Materials]([currecncy] ASC);


GO

