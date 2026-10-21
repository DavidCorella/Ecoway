CREATE TABLE [dbo].[users] (
    [id]                    VARCHAR (30)     NOT NULL,
    [PublicId]              UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [email]                 VARCHAR (150)    NULL,
    [password]              VARCHAR (255)    NOT NULL,
    [role]                  UNIQUEIDENTIFIER NOT NULL,
    [is_active]             BIT              DEFAULT ((1)) NOT NULL,
    [last_login]            DATETIME         DEFAULT (getdate()) NULL,
    [created_at]            DATETIME         DEFAULT (getdate()) NOT NULL,
    [updated_at]            DATETIME         DEFAULT (getdate()) NOT NULL,
    [nationality_id]        INT              NOT NULL,
    [mustChangePassword]    BIT              DEFAULT ((1)) NULL,
    [islock]                BIT              DEFAULT ((0)) NULL,
    [position]              VARCHAR (100)    NULL,
    [failed_login_attempts] INT              DEFAULT ((0)) NOT NULL,
    [locked_until]          DATETIME         NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_users_Nationality] FOREIGN KEY ([nationality_id]) REFERENCES [dbo].[Nationality] ([optionsNationality]),
    CONSTRAINT [FK_users_Roles] FOREIGN KEY ([role]) REFERENCES [dbo].[Roles] ([id]),
    CONSTRAINT [UQ_users_PublicId] UNIQUE NONCLUSTERED ([PublicId] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_users_nationality_id]
    ON [dbo].[users]([nationality_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_users_role]
    ON [dbo].[users]([role] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_users_is_active]
    ON [dbo].[users]([is_active] ASC);


GO

