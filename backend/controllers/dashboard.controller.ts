import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's investments
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select(`
        *,
        properties (
          id,
          title,
          location,
          type,
          status,
          image,
          target_return,
          total_value,
          share_price
        )
      `)
      .eq('user_id', userId);

    if (investmentsError) {
      console.error('Error fetching investments:', investmentsError);
      return res.status(500).json({ error: 'Failed to fetch investments' });
    }

    // Calculate stats
    const totalAssets = investments?.reduce((sum: number, inv: any) => {
      return sum + (inv.amount_invested || 0);
    }, 0) || 0;

    const totalDividends = investments?.reduce((sum: number, inv: any) => {
      return sum + (inv.dividends_earned || 0);
    }, 0) || 0;

    const activeHoldings = investments?.filter(inv =>
      inv.properties?.status === 'active'
    ).length || 0;

    // Calculate performance (simplified)
    const performance = totalAssets > 0 ?
      ((totalDividends / totalAssets) * 100) : 0;

    res.json({
      totalAssets,
      totalDividends,
      activeHoldings,
      performance: performance.toFixed(2),
      investments: investments || []
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

    const { data: investments, error } = await supabase
      .from('investments')
      .select(`
        *,
        properties (
          id,
          title,
          location,
          type,
          status,
          image,
          target_return,
          total_value,
          share_price
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching assets:', error);
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }

    res.json({ assets: investments || [] });
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

    const { data: dividends, error } = await supabase
      .from('dividends')
      .select('*')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching dividends:', error);
      return res.status(500).json({ error: 'Failed to fetch dividends' });
    }

    res.json({ dividends: dividends || [] });
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

    const { data: holdings, error } = await supabase
      .from('investments')
      .select(`
        *,
        properties (
          id,
          title,
          location,
          type,
          status,
          image,
          target_return,
          total_value,
          share_price
        )
      `)
      .eq('user_id', userId)
      .eq('properties.status', 'active');

    if (error) {
      console.error('Error fetching holdings:', error);
      return res.status(500).json({ error: 'Failed to fetch holdings' });
    }

    res.json({ holdings: holdings || [] });
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
    const { data: investments, error } = await supabase
      .from('investments')
      .select(`
        *,
        properties (
          id,
          title,
          target_return
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching performance data:', error);
      return res.status(500).json({ error: 'Failed to fetch performance data' });
    }

    // Calculate performance metrics
    const performanceData = {
      totalInvested: investments?.reduce((sum: number, inv: any) => sum + (inv.amount_invested || 0), 0) || 0,
      totalDividends: investments?.reduce((sum: number, inv: any) => sum + (inv.dividends_earned || 0), 0) || 0,
      currentValue: investments?.reduce((sum: number, inv: any) => sum + (inv.current_value || inv.amount_invested || 0), 0) || 0,
      investments: investments || []
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
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select(`
        total_invested,
        total_dividends_received,
        properties (
          id,
          property_type,
          total_valuation,
          price_per_share
        )
      `)
      .eq('user_id', userId);

    if (investmentsError) {
      console.error('Error fetching investments for asset breakdown:', investmentsError);
      return res.status(500).json({ error: 'Failed to fetch asset breakdown' });
    }

    // Group investments by property_type
    const breakdown: { [key: string]: { total: number; count: number } } = {};
    let totalInvested = 0;
    let totalDividends = 0;

    investments?.forEach((inv: any) => {
      const propertyType = inv.properties?.property_type || 'unknown';
      const invested = parseFloat(inv.total_invested || '0');
      const dividends = parseFloat(inv.total_dividends_received || '0');

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
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .in('transaction_type', ['investment', 'dividend', 'deposit', 'withdrawal'])
      .order('created_at', { ascending: true });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return res.status(500).json({ error: 'Failed to fetch transaction data' });
    }

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
    const sortedTransactions = (transactions || []).filter(tx => 
      new Date(tx.created_at) >= startDate
    ).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Get current investments for final value calculation
    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId);

    const currentInvested = investments?.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.total_invested || inv.amount_invested || '0'), 0) || 0;

    // Build data points
    const intervals: { [key: string]: { invested: number; dividends: number } } = {};
    
    sortedTransactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const intervalKey = period === 'yearly' 
        ? `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
        : txDate.toISOString().split('T')[0];

      if (!intervals[intervalKey]) {
        intervals[intervalKey] = { invested: 0, dividends: 0 };
      }

      if (tx.transaction_type === 'investment') {
        intervals[intervalKey].invested += parseFloat(tx.amount);
      } else if (tx.transaction_type === 'dividend') {
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
      const currentValue = currentInvested + (investments?.reduce((sum: number, inv: any) => 
        sum + parseFloat(inv.dividends_earned || '0'), 0) || 0);
      
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