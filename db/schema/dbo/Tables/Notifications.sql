CREATE TABLE [dbo].[Notifications] (
    [id]         UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [title]      NVARCHAR (150)   NOT NULL,
    [message]    NVARCHAR (500)   NOT NULL,
    [created_at] DATETIME         DEFAULT (getdate()) NOT NULL,
    [screen_id]  UNIQUEIDENTIFIER NULL,
    [user_id]    VARCHAR (30)     NULL,
    [action]     VARCHAR (50)     NULL,
    [reference]  VARCHAR (50)     NULL,
    [is_read]    BIT              DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_Notifications_Screens] FOREIGN KEY ([screen_id]) REFERENCES [dbo].[Screens] ([id]),
    CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([id])
);


GO

CREATE NONCLUSTERED INDEX [IX_Notifications_user_id]
    ON [dbo].[Notifications]([user_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Notifications_screen_id]
    ON [dbo].[Notifications]([screen_id] ASC);


GO

