CREATE TABLE [dbo].[Tickets] (
    [id]                      UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [ticket_number]           VARCHAR (30)     NOT NULL,
    [company_id]              UNIQUEIDENTIFIER NOT NULL,
    [ticket_date]             DATE             NOT NULL,
    [client_responsible_name] VARCHAR (150)    NOT NULL,
    [client_responsible_id]   VARCHAR (30)     NOT NULL,
    [ecoway_responsible_name] VARCHAR (150)    NOT NULL,
    [ecoway_responsible_id]   VARCHAR (30)     NOT NULL,
    [image_path]              VARCHAR (300)    NULL,
    [freight_count]           INT              DEFAULT ((1)) NOT NULL,
    [status]                  VARCHAR (20)     DEFAULT ('Active') NOT NULL,
    [void_reason]             VARCHAR (300)    NULL,
    [invoiced]                BIT              DEFAULT ((0)) NOT NULL,
    [version]                 INT              DEFAULT ((1)) NOT NULL,
    [created_at]              DATETIME         DEFAULT (getdate()) NOT NULL,
    [created_by]              UNIQUEIDENTIFIER NULL,
    [updated_at]              DATETIME         NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_Tickets_Company] FOREIGN KEY ([company_id]) REFERENCES [dbo].[Company] ([id]),
    CONSTRAINT [UQ_Tickets_TicketNumber] UNIQUE NONCLUSTERED ([ticket_number] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Tickets_ticket_date]
    ON [dbo].[Tickets]([ticket_date] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Tickets_status_created_at]
    ON [dbo].[Tickets]([status] ASC, [created_at] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Tickets_CompanyId]
    ON [dbo].[Tickets]([company_id] ASC);


GO

