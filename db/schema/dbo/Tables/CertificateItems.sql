CREATE TABLE [dbo].[CertificateItems] (
    [id]                   UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [certificate_id]       UNIQUEIDENTIFIER NOT NULL,
    [material_description] VARCHAR (200)    NOT NULL,
    [quantity_kg]          DECIMAL (18, 2)  NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_CertificateItems_Certificates] FOREIGN KEY ([certificate_id]) REFERENCES [dbo].[Certificates] ([id])
);


GO

