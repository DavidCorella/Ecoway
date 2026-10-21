CREATE TABLE [dbo].[Certificates] (
    [id]                    UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [certificate_number]    VARCHAR (30)     NOT NULL,
    [company_id]            UNIQUEIDENTIFIER NOT NULL,
    [contact_name]          VARCHAR (150)    NOT NULL,
    [contact_position]      VARCHAR (100)    NOT NULL,
    [contact_phone]         VARCHAR (30)     NOT NULL,
    [contact_cell]          VARCHAR (30)     NOT NULL,
    [contact_email]         VARCHAR (150)    NOT NULL,
    [certificate_date_from] DATE             NOT NULL,
    [certificate_date_to]   DATE             NOT NULL,
    [issued_date]           DATE             NOT NULL,
    [signer_name]           VARCHAR (150)    NOT NULL,
    [signer_position]       VARCHAR (150)    NOT NULL,
    [status]                VARCHAR (20)     DEFAULT ('Active') NOT NULL,
    [void_reason]           VARCHAR (300)    NULL,
    [version]               INT              DEFAULT ((1)) NOT NULL,
    [created_by]            UNIQUEIDENTIFIER NULL,
    [created_by_display]    VARCHAR (200)    NULL,
    [created_at]            DATETIME         DEFAULT (getdate()) NOT NULL,
    [updated_at]            DATETIME         NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_Certificates_Company] FOREIGN KEY ([company_id]) REFERENCES [dbo].[Company] ([id]),
    CONSTRAINT [UQ_Certificates_Number] UNIQUE NONCLUSTERED ([certificate_number] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Certificates_status_created_at]
    ON [dbo].[Certificates]([status] ASC, [created_at] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Certificates_company_id]
    ON [dbo].[Certificates]([company_id] ASC);


GO

