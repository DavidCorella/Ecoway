CREATE TABLE [dbo].[CertificateTickets] (
    [id]             UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [certificate_id] UNIQUEIDENTIFIER NOT NULL,
    [ticket_id]      UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_CertificateTickets_Certificates] FOREIGN KEY ([certificate_id]) REFERENCES [dbo].[Certificates] ([id]),
    CONSTRAINT [FK_CertificateTickets_Tickets] FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[Tickets] ([id])
);


GO

