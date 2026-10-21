CREATE TABLE [dbo].[CollectionSummaries] (
    [id]               UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [summary_number]   VARCHAR (30)     NOT NULL,
    [company_id]       UNIQUEIDENTIFIER NOT NULL,
    [date_from]        DATE             NOT NULL,
    [date_to]          DATE             NOT NULL,
    [period_label]     VARCHAR (150)    NOT NULL,
    [contact_name]     VARCHAR (150)    NOT NULL,
    [contact_position] VARCHAR (100)    NOT NULL,
    [contact_phone]    VARCHAR (30)     NOT NULL,
    [contact_cell]     VARCHAR (30)     NOT NULL,
    [contact_email]    VARCHAR (150)    NOT NULL,
    [tax_rate]         DECIMAL (5, 2)   DEFAULT ((13)) NOT NULL,
    [currency]         VARCHAR (10)     DEFAULT ('USD') NOT NULL,
    [exchange_rate]    DECIMAL (12, 6)  DEFAULT ((1)) NOT NULL,
    [status]           VARCHAR (20)     DEFAULT ('Active') NOT NULL,
    [void_reason]      VARCHAR (300)    NULL,
    [version]          INT              DEFAULT ((1)) NOT NULL,
    [created_by]       UNIQUEIDENTIFIER NULL,
    [created_at]       DATETIME         DEFAULT (getdate()) NOT NULL,
    [updated_at]       DATETIME         NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [CK_CollectionSummaries_Currency] CHECK ([currency]='CRC' OR [currency]='USD'),
    CONSTRAINT [FK_CollectionSummaries_Company] FOREIGN KEY ([company_id]) REFERENCES [dbo].[Company] ([id]),
    CONSTRAINT [UQ_CollectionSummaries_Number] UNIQUE NONCLUSTERED ([summary_number] ASC)
);


GO

