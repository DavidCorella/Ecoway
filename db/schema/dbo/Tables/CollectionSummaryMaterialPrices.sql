CREATE TABLE [dbo].[CollectionSummaryMaterialPrices] (
    [id]                   UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [summary_id]           UNIQUEIDENTIFIER NOT NULL,
    [material_description] VARCHAR (200)    NOT NULL,
    [price_per_kg]         DECIMAL (18, 4)  NOT NULL,
    [comment]              VARCHAR (300)    NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_CollectionSummaryMaterialPrices_Summaries] FOREIGN KEY ([summary_id]) REFERENCES [dbo].[CollectionSummaries] ([id])
);


GO

