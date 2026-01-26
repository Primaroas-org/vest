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