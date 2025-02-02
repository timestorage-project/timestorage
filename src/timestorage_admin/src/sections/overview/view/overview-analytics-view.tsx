import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { _tasks, _timeline } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Equipment Analytics Dashboard 📊
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Total Equipment"
            percent={12.5}
            total={156}
            color="primary"
            icon=""
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [25, 35, 44, 55, 68, 87, 122, 156],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Inst. Equipment"
            percent={12.5}
            total={156}
            color="secondary"
            icon=""
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [25, 35, 44, 55, 68, 87, 122, 156],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Pending Installation"
            percent={-2.3}
            total={33}
            color="warning"
            icon=""
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [5, 7, 9, 10, 10, 10, 20, 33],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Active Installers"
            percent={5.7}
            total={24}
            color="info"
            icon=""
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [8, 12, 15, 18, 20, 22, 23, 24],
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentVisits
            title="Equipment by Type"
            chart={{
              series: [
                { label: 'Double Glazed', value: 4344 },
                { label: 'Triple Glazed', value: 5435 },
                { label: 'Single Glazed', value: 1443 },
                { label: 'Special Glass', value: 443 },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AnalyticsWebsiteVisits
            title="Monthly Equipment Installation"
            subheader="(+43%) than last year"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              series: [
                {
                  name: 'Completed Installations',
                  data: [44, 55, 57, 56, 61, 58, 63, 60, 66],
                },
                {
                  name: 'Scheduled Installations',
                  data: [35, 41, 36, 26, 45, 48, 52, 53, 41],
                },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AnalyticsConversionRates
            title="Installation Success Rate by Region"
            subheader="(+8%) than last quarter"
            chart={{
              categories: ['North', 'South', 'East', 'West', 'Central'],
              series: [
                { name: '2022', data: [88, 85, 87, 86, 82] },
                { name: '2023', data: [92, 88, 90, 88, 85] },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentSubject
            title="Equipment Performance Metrics"
            chart={{
              categories: [
                'Energy',
                'Durability',
                'Installation',
                'Maintenance',
                'Cost',
                'Quality',
              ],
              series: [
                { name: 'Target', data: [90, 85, 85, 80, 70, 95] },
                { name: 'Actual', data: [85, 88, 82, 78, 75, 92] },
                { name: 'Industry Avg', data: [70, 75, 70, 65, 60, 80] },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AnalyticsNews
            title="Latest Equipment Updates"
            list={[
              {
                id: '1',
                title: 'New Triple Glazed Window Series Released',
                description: 'Introducing our latest innovation in energy-efficient windows',
                postedAt: '2023-10-01',
                coverUrl: '/assets/images/covers/cover_1.jpg',
                totalViews: 1234,
                totalShares: 45,
                totalComments: 12,
                author: {
                  name: 'Product Team',
                  avatarUrl: '/assets/images/avatars/avatar_1.jpg',
                },
                totalFavorites: 0,
              },
              {
                id: '2',
                title: 'Installation Process Optimization',
                description: 'Reduced installation time by 25% with new methodologies',
                postedAt: '2023-09-28',
                coverUrl: '/assets/images/covers/cover_2.jpg',
                totalViews: 987,
                totalShares: 32,
                totalComments: 8,
                author: {
                  name: 'Installation Team',
                  avatarUrl: '/assets/images/avatars/avatar_2.jpg',
                },
                totalFavorites: 0,
              },
              {
                id: '3',
                title: 'Sustainability Achievement',
                description: '90% of our equipment now uses recycled materials',
                postedAt: '2023-09-25',
                coverUrl: '/assets/images/covers/cover_3.jpg',
                totalViews: 654,
                totalShares: 28,
                totalComments: 15,
                author: {
                  name: 'Sustainability Department',
                  avatarUrl: '/assets/images/avatars/avatar_3.jpg',
                },
                totalFavorites: 0,
              },
            ]}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AnalyticsTrafficBySite
            title="Distribution Channels"
            list={[
              { value: 'direct', label: 'Direct Sales', total: 323234 },
              { value: 'partners', label: 'Partners', total: 341212 },
              { value: 'retail', label: 'Retail', total: 411213 },
              { value: 'online', label: 'Online', total: 443232 },
            ]}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AnalyticsTasks
            title="Installation Tasks"
            list={[
              { id: '1', name: 'Create New Installation Schedule' },
              { id: '2', name: 'Quality Check - Batch XYZ' },
              { id: '3', name: 'Update Installation Guidelines' },
              { id: '4', name: 'Review Customer Feedback' },
              { id: '5', name: 'Train New Installers' },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
