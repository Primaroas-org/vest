import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { investments, properties, transactions } from '../db/schema.js';
import { eq, and, inArray, desc } from 'drizzle-orm';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's investments with properties
    const userInvestments = await db.query.investments.findMany({
      where: eq(investments.userId, userId),
      with: {
        property: true,
      },
    });

    // Calculate stats
    const totalAssets = userInvestments?.reduce((sum: number, inv: any) => {
      return sum + parseFloat(inv.totalInvested || '0');
    }, 0) || 0;

    const totalDividends = userInvestments?.reduce((sum: number, inv: any) => {
      return sum + parseFloat(inv.totalDividendsReceived || '0');
    }, 0) || 0;

    const activeHoldings = userInvestments?.filter(inv =>
      inv.property?.status === 'active'
    ).length || 0;

    // Calculate performance (simplified)
    const performance = totalAssets > 0 ?
      ((totalDividends / totalAssets) * 100) : 0;

    // Map to expected format
    const mappedInvestments = userInvestments.map(inv => ({
      ...inv,
      property: inv.property ? {
        id: inv.property.id,
        title: inv.property.name,
        location: inv.property.address,
        type: inv.property.propertyType,
        status: inv.property.status,
        image: (inv.property.images as any)?.[0] || null,
        target_return: inv.property.expectedAnnualYield,
        total_value: inv.property.totalValuation,
        share_price: inv.property.pricePerShare,
      } : null,
    }));

    res.json({
      totalAssets,
      totalDividends,
      activeHoldings,
      performance: performance.toFixed(2),
      investments: mappedInvestments || []
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssets = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userInvestments = await db.query.investments.findMany({
      where: eq(investments.userId, userId),
      with: {
        property: true,
      },
    });

    const mappedAssets = userInvestments.map(inv => ({
      ...inv,
      properties: inv.property ? {
        id: inv.property.id,
        title: inv.property.name,
        location: inv.property.address,
        type: inv.property.propertyType,
        status: inv.property.status,
        image: (inv.property.images as any)?.[0] || null,
        target_return: inv.property.expectedAnnualYield,
        total_value: inv.property.totalValuation,
        share_price: inv.property.pricePerShare,
      } : null,
    }));

    res.json({ assets: mappedAssets || [] });
  } catch (error) {
    console.error('Error in getAssets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDividends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch dividend transactions
    const dividendTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.transactionType, 'dividend')
      ))
      .orderBy(desc(transactions.createdAt));

    res.json({ dividends: dividendTransactions || [] });
  } catch (error) {
    console.error('Error in getDividends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHoldings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userInvestments = await db.query.investments.findMany({
      where: eq(investments.userId, userId),
      with: {
        property: true,
      },
    });

    const activeHoldings = userInvestments
      .filter(inv => inv.property?.status === 'active')
      .map(inv => ({
        ...inv,
        properties: inv.property ? {
          id: inv.property.id,
          title: inv.property.name,
          location: inv.property.address,
          type: inv.property.propertyType,
          status: inv.property.status,
          image: (inv.property.images as any)?.[0] || null,
          target_return: inv.property.expectedAnnualYield,
          total_value: inv.property.totalValuation,
          share_price: inv.property.pricePerShare,
        } : null,
      }));

    res.json({ holdings: activeHoldings || [] });
  } catch (error) {
    console.error('Error in getHoldings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPerformance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get investment history for performance calculation
    const userInvestments = await db.query.investments.findMany({
      where: eq(investments.userId, userId),
      with: {
        property: true,
      },
    });

    // Calculate performance metrics
    const performanceData = {
      totalInvested: userInvestments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalInvested || '0'), 0) || 0,
      totalDividends: userInvestments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalDividendsReceived || '0'), 0) || 0,
      currentValue: userInvestments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalInvested || '0'), 0) || 0,
      investments: userInvestments || []
    };

    res.json(performanceData);
  } catch (error) {
    console.error('Error in getPerformance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssetBreakdown = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's investments with property types
    const userInvestments = await db.query.investments.findMany({
      where: eq(investments.userId, userId),
      with: {
        property: true,
      },
    });

    // Group investments by property_type
    const breakdown: { [key: string]: { total: number; count: number } } = {};
    let totalInvested = 0;
    let totalDividends = 0;

    userInvestments?.forEach((inv) => {
      const propertyType = inv.property?.propertyType || 'unknown';
      const invested = parseFloat(inv.totalInvested || '0');
      const dividends = parseFloat(inv.totalDividendsReceived || '0');

      if (!breakdown[propertyType]) {
        breakdown[propertyType] = { total: 0, count: 0 };
      }

      breakdown[propertyType].total += invested;
      breakdown[propertyType].count += 1;
      totalInvested += invested;
      totalDividends += dividends;
    });

    // Calculate growth percentage (current value / invested - 1) * 100
    // For simplicity, we'll use: (invested + dividends) / invested * 100 - 100
    // In a real scenario, you'd calculate current market value
    const currentValue = totalInvested + totalDividends;
    const growthPercentage = totalInvested > 0 
      ? ((currentValue / totalInvested) * 100 - 100).toFixed(1)
      : '0.0';

    // Convert to array format with proper labels
    const assetTypes = Object.keys(breakdown).map(type => {
      // Map database property_type to display labels
      const typeLabels: { [key: string]: string } = {
        'apartment': 'residential',
        'residential': 'residential',
        'commercial': 'commercial',
        'mixed': 'mixed',
        'mixed_use': 'mixed'
      };

      return {
        type: typeLabels[type.toLowerCase()] || type,
        total: breakdown[type].total,
        count: breakdown[type].count
      };
    });

    res.json({
      growthPercentage: parseFloat(growthPercentage),
      assetTypes,
      totalInvested,
      totalDividends,
      currentValue
    });
  } catch (error) {
    console.error('Error in getAssetBreakdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPerformanceGraph = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { period = 'yearly' } = req.query;

    // Get all transactions to build time series
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        inArray(transactions.transactionType, ['investment', 'dividend', 'deposit', 'withdrawal'])
      ))
      .orderBy(transactions.createdAt);

    // Calculate portfolio value over time
    let runningBalance = 0;
    let runningInvested = 0;
    const dataPoints: Array<{ date: string; value: number; invested: number }> = [];

    // Group by time period
    const now = new Date();
    let startDate: Date;
    let intervalDays: number;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        intervalDays = 1;
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        intervalDays = 1;
        break;
      case 'yearly':
      default:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        intervalDays = 30; // Monthly intervals for yearly view
        break;
    }

    // Process transactions chronologically
    const sortedTransactions = (userTransactions || []).filter(tx => 
      new Date(tx.createdAt) >= startDate
    ).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Get current investments for final value calculation
    const currentInvestments = await db
      .select()
      .from(investments)
      .where(eq(investments.userId, userId));

    const currentInvested = currentInvestments?.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.totalInvested || '0'), 0) || 0;

    // Build data points
    const intervals: { [key: string]: { invested: number; dividends: number } } = {};
    
    sortedTransactions.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      const intervalKey = period === 'yearly' 
        ? `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
        : txDate.toISOString().split('T')[0];

      if (!intervals[intervalKey]) {
        intervals[intervalKey] = { invested: 0, dividends: 0 };
      }

      if (tx.transactionType === 'investment') {
        intervals[intervalKey].invested += parseFloat(tx.amount);
      } else if (tx.transactionType === 'dividend') {
        intervals[intervalKey].dividends += parseFloat(tx.amount);
      }
    });

    // Convert to array and calculate cumulative values
    let cumulativeInvested = 0;
    let cumulativeDividends = 0;

    Object.keys(intervals).sort().forEach(key => {
      cumulativeInvested += intervals[key].invested;
      cumulativeDividends += intervals[key].dividends;
      
      // Estimate current value (invested + dividends + appreciation)
      // For simplicity, we'll use invested + dividends as the value
      const estimatedValue = cumulativeInvested + cumulativeDividends;

      dataPoints.push({
        date: key,
        value: estimatedValue,
        invested: cumulativeInvested
      });
    });

    // Add current point if we have investments
    if (currentInvested > 0 && dataPoints.length > 0) {
      const lastPoint = dataPoints[dataPoints.length - 1];
      const currentValue = currentInvested + (currentInvestments?.reduce((sum: number, inv: any) => 
        sum + parseFloat(inv.totalDividendsReceived || '0'), 0) || 0);
      
      if (currentValue !== lastPoint.value) {
        dataPoints.push({
          date: now.toISOString().split('T')[0],
          value: currentValue,
          invested: currentInvested
        });
      }
    }

    // If no data, return empty array with current values
    if (dataPoints.length === 0 && currentInvested > 0) {
      dataPoints.push({
        date: now.toISOString().split('T')[0],
        value: currentInvested,
        invested: currentInvested
      });
    }

    res.json({ dataPoints });
  } catch (error) {
    console.error('Error in getPerformanceGraph:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};