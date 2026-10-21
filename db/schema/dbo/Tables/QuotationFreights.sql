CREATE TABLE [dbo].[QuotationFreights] (
    [id]           UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [quotation_id] UNIQUEIDENTIFIER NOT NULL,
    [quantity]     INT              DEFAULT ((1)) NOT NULL,
    [cost]         DECIMAL (18, 2)  NOT NULL,
    [description]  VARCHAR (200)    NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_QuotationFreights_Quotations] FOREIGN KEY ([quotation_id]) REFERENCES [dbo].[Quotations] ([id])
);


GO

CREATE NONCLUSTERED INDEX [IX_QuotationFreights_quotation_id]
    ON [dbo].[QuotationFreights]([quotation_id] ASC);


GO

