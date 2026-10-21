CREATE TABLE [dbo].[Company] (
    [id]               UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [nombre_comercial] VARCHAR (150)    NOT NULL,
    [razon_social]     VARCHAR (150)    NOT NULL,
    [cedula_juridica]  VARCHAR (30)     NOT NULL,
    [address]          VARCHAR (300)    NOT NULL,
    [contact_name]     VARCHAR (150)    NOT NULL,
    [contact_id]       VARCHAR (30)     NOT NULL,
    [contact_position] VARCHAR (100)    NOT NULL,
    [contact_phone]    VARCHAR (30)     NOT NULL,
    [contact_cell]     VARCHAR (30)     NOT NULL,
    [email]            VARCHAR (150)    NOT NULL,
    [created_at]       DATETIME         DEFAULT (getdate()) NOT NULL,
    [project]          VARCHAR (150)    NULL,
    [is_active]        BIT              DEFAULT ((1)) NOT NULL,
    [project_key]      AS               (isnull([project],'')) PERSISTED NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [CK_Company_CedulaJuridica] CHECK ([cedula_juridica] like '[0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9][0-9][0-9][0-9]'),
    CONSTRAINT [CK_Company_ContactCell] CHECK (NOT [contact_cell] like '%[^0-9]%'),
    CONSTRAINT [CK_Company_ContactPhone] CHECK (NOT [contact_phone] like '%[^0-9]%')
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ_Company_NombreProyecto]
    ON [dbo].[Company]([nombre_comercial] ASC, [project_key] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Company_is_active]
    ON [dbo].[Company]([is_active] ASC);


GO

