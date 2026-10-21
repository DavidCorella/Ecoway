CREATE TABLE [dbo].[ExitTickets] (
    [id]                        UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [exit_ticket_number]        VARCHAR (30)     NOT NULL,
    [destination_company_id]    UNIQUEIDENTIFIER NOT NULL,
    [exit_date]                 DATE             NOT NULL,
    [receiver_responsible_name] VARCHAR (150)    NOT NULL,
    [receiver_responsible_id]   VARCHAR (30)     NOT NULL,
    [ecoway_responsible_name]   VARCHAR (150)    NOT NULL,
    [ecoway_responsible_id]     VARCHAR (30)     NOT NULL,
    [image_path]                VARCHAR (300)    NULL,
    [status]                    VARCHAR (20)     DEFAULT ('Active') NOT NULL,
    [void_reason]               VARCHAR (300)    NULL,
    [version]                   INT              DEFAULT ((1)) NOT NULL,
    [created_at]                DATETIME         DEFAULT (getdate()) NOT NULL,
    [created_by]                UNIQUEIDENTIFIER NULL,
    [updated_at]                DATETIME         NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_ExitTickets_Company] FOREIGN KEY ([destination_company_id]) REFERENCES [dbo].[Company] ([id]),
    CONSTRAINT [UQ_ExitTickets_Number] UNIQUE NONCLUSTERED ([exit_ticket_number] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_ExitTickets_exit_date]
    ON [dbo].[ExitTickets]([exit_date] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_ExitTickets_status_created_at]
    ON [dbo].[ExitTickets]([status] ASC, [created_at] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_ExitTickets_DestinationCompanyId]
    ON [dbo].[ExitTickets]([destination_company_id] ASC);


GO

