CREATE TABLE [dbo].[QuotationItems] (
    [id]                   UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [quotation_id]         UNIQUEIDENTIFIER NOT NULL,
    [material_description] VARCHAR (200)    NOT NULL,
    [quantity_kg]          DECIMAL (18, 2)  NOT NULL,
    [cost]                 DECIMAL (18, 2)  NOT NULL,
    [price_per_kg]         DECIMAL (18, 2)  NULL,
    [comment]              VARCHAR (300)    NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_QuotationItems_Quotations] FOREIGN KEY ([quotation_id]) REFERENCES [dbo].[Quotations] ([id])
);


GO

CREATE NONCLUSTERED INDEX [IX_QuotationItems_quotation_id]
    ON [dbo].[QuotationItems]([quotation_id] ASC);


GO

