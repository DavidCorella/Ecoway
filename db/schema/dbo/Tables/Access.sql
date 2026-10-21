CREATE TABLE [dbo].[Access] (
    [Role_id]   UNIQUEIDENTIFIER NOT NULL,
    [Screen_id] UNIQUEIDENTIFIER NOT NULL,
    [Active]    BIT              DEFAULT ((1)) NOT NULL,
    PRIMARY KEY CLUSTERED ([Role_id] ASC, [Screen_id] ASC),
    CONSTRAINT [FK_Access_Roles] FOREIGN KEY ([Role_id]) REFERENCES [dbo].[Roles] ([id]),
    CONSTRAINT [FK_Access_Screens] FOREIGN KEY ([Screen_id]) REFERENCES [dbo].[Screens] ([id])
);


GO

CREATE NONCLUSTERED INDEX [IX_Access_Screen_id]
    ON [dbo].[Access]([Screen_id] ASC);


GO

