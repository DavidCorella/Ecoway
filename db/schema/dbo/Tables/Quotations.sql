CREATE TABLE [dbo].[Quotations] (
    [id]                       UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [quotation_number]         VARCHAR (30)     NOT NULL,
    [quotation_date]           DATE             NOT NULL,
    [company_id]               UNIQUEIDENTIFIER NOT NULL,
    [contact_name]             VARCHAR (150)    NOT NULL,
    [contact_position]         VARCHAR (100)    NOT NULL,
    [contact_phone]            VARCHAR (30)     NOT NULL,
    [contact_cell]             VARCHAR (30)     NOT NULL,
    [contact_email]            VARCHAR (150)    NOT NULL,
    [tax_rate]                 DECIMAL (5, 2)   DEFAULT ((13)) NOT NULL,
    [validity_days]            INT              DEFAULT ((30)) NOT NULL,
    [service_description]      NVARCHAR (MAX)   NULL,
    [delivery_condition]       NVARCHAR (MAX)   NOT NULL,
    [payment_terms]            NVARCHAR (MAX)   NOT NULL,
    [ownership_conditions]     NVARCHAR (MAX)   NOT NULL,
    [incident_responsibility]  NVARCHAR (MAX)   NOT NULL,
    [force_majeure_conditions] NVARCHAR (MAX)   NOT NULL,
    [other_conditions]         NVARCHAR (MAX)   NOT NULL,
    [signer_name]              VARCHAR (150)    NOT NULL,
    [signer_position]          VARCHAR (150)    NOT NULL,
    [currency]                 VARCHAR (10)     DEFAULT ('USD') NOT NULL,
    [exchange_rate]            DECIMAL (12, 6)  DEFAULT ((1)) NOT NULL,
    [status]                   VARCHAR (20)     DEFAULT ('Active') NOT NULL,
    [void_reason]              VARCHAR (300)    NULL,
    [version]                  INT              DEFAULT ((1)) NOT NULL,
    [created_by]               UNIQUEIDENTIFIER NULL,
    [created_at]               DATETIME         DEFAULT (getdate()) NOT NULL,
    [updated_at]               DATETIME         NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [CK_Quotations_Currency] CHECK ([currency]='CRC' OR [currency]='USD'),
    CONSTRAINT [CK_Quotations_NumberDigits] CHECK (NOT [quotation_number] like '%[^0-9-]%'),
    CONSTRAINT [FK_Quotations_Company] FOREIGN KEY ([company_id]) REFERENCES [dbo].[Company] ([id]),
    CONSTRAINT [UQ_Quotations_Number] UNIQUE NONCLUSTERED ([quotation_number] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Quotations_company_id]
    ON [dbo].[Quotations]([company_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Quotations_quotation_date]
    ON [dbo].[Quotations]([quotation_date] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Quotations_status_created_at]
    ON [dbo].[Quotations]([status] ASC, [created_at] ASC);


GO

