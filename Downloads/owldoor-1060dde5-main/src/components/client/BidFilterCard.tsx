import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCheck, faDollarSign, faCalendarWeek } from "@fortawesome/free-solid-svg-icons";

interface BidFilter {
  id: string;
  name: string;
  maxBid: number;
  maxWeeklySpend: number;
  currentSpend: number;
  filters: {
    minTransactions?: number;
    maxTransactions?: number;
    minExperience?: number;
    locations?: string[];
    fullPartTime?: 'full' | 'part' | 'both';
    motivationMin?: number;
    targetBrokerages?: string[];
    exclusive?: boolean;
  };
}

interface BidFilterCardProps {
  filter: BidFilter;
  onUpdate: (filter: BidFilter) => void;
  onDelete: (id: string) => void;
}

export const BidFilterCard = ({ filter, onUpdate, onDelete }: BidFilterCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFilter, setEditedFilter] = useState(filter);

  const budgetReached = filter.currentSpend >= filter.maxWeeklySpend;
  const spendPercentage = (filter.currentSpend / filter.maxWeeklySpend) * 100;

  const handleSave = () => {
    onUpdate(editedFilter);
    setIsEditing(false);
  };

  return (
    <Card className={`${budgetReached ? "opacity-50 bg-muted" : ""} transition-all`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedFilter.name}
                onChange={(e) => setEditedFilter({ ...editedFilter, name: e.target.value })}
                className="mb-2"
              />
            ) : (
              <CardTitle className="flex items-center gap-2">
                {filter.name}
                {budgetReached && <Badge variant="secondary">Budget Reached</Badge>}
              </CardTitle>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(filter.id)}
            className="text-destructive"
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`maxBid-${filter.id}`}>Max Bid ($)</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faDollarSign} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id={`maxBid-${filter.id}`}
                    type="number"
                    value={editedFilter.maxBid}
                    onChange={(e) => setEditedFilter({ ...editedFilter, maxBid: parseFloat(e.target.value) })}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`maxWeekly-${filter.id}`}>Max Weekly Spend ($)</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faCalendarWeek} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id={`maxWeekly-${filter.id}`}
                    type="number"
                    value={editedFilter.maxWeeklySpend}
                    onChange={(e) => setEditedFilter({ ...editedFilter, maxWeeklySpend: parseFloat(e.target.value) })}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor={`locations-${filter.id}`}>Locations (Required) *</Label>
                <Input
                  id={`locations-${filter.id}`}
                  placeholder="City, State, Zip (at least one required)"
                  value={editedFilter.filters.locations?.join(", ") || ""}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    setEditedFilter({
                      ...editedFilter,
                      filters: { 
                        ...editedFilter.filters, 
                        locations: value ? e.target.value.split(",").map(l => l.trim()).filter(l => l) : []
                      }
                    });
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  At least one location required for matching
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`fullPartTime-${filter.id}`}>Full/Part Time</Label>
                  <select
                    id={`fullPartTime-${filter.id}`}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editedFilter.filters.fullPartTime || "both"}
                    onChange={(e) => setEditedFilter({
                      ...editedFilter,
                      filters: { ...editedFilter.filters, fullPartTime: e.target.value as 'full' | 'part' | 'both' }
                    })}
                  >
                    <option value="both">Both</option>
                    <option value="full">Full Time</option>
                    <option value="part">Part Time</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor={`motivationMin-${filter.id}`}>Motivation Min (1-10)</Label>
                  <Input
                    id={`motivationMin-${filter.id}`}
                    type="number"
                    min="1"
                    max="10"
                    value={editedFilter.filters.motivationMin || ""}
                    onChange={(e) => setEditedFilter({
                      ...editedFilter,
                      filters: { ...editedFilter.filters, motivationMin: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`minTrans-${filter.id}`}>Min Transactions</Label>
                  <Input
                    id={`minTrans-${filter.id}`}
                    type="number"
                    value={editedFilter.filters.minTransactions || ""}
                    onChange={(e) => setEditedFilter({
                      ...editedFilter,
                      filters: { ...editedFilter.filters, minTransactions: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor={`minExp-${filter.id}`}>Yrs Experience</Label>
                  <Input
                    id={`minExp-${filter.id}`}
                    type="number"
                    value={editedFilter.filters.minExperience || ""}
                    onChange={(e) => setEditedFilter({
                      ...editedFilter,
                      filters: { ...editedFilter.filters, minExperience: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor={`targetBrokerages-${filter.id}`}>Target Brokerages</Label>
                <Input
                  id={`targetBrokerages-${filter.id}`}
                  placeholder="Brokerage names (comma separated)"
                  value={editedFilter.filters.targetBrokerages?.join(", ") || ""}
                  onChange={(e) => setEditedFilter({
                    ...editedFilter,
                    filters: { ...editedFilter.filters, targetBrokerages: e.target.value.split(",").map(b => b.trim()) }
                  })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`exclusive-${filter.id}`}
                  checked={editedFilter.filters.exclusive || false}
                  onChange={(e) => setEditedFilter({
                    ...editedFilter,
                    filters: { ...editedFilter.filters, exclusive: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor={`exclusive-${filter.id}`}>Exclusive Leads Only</Label>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Save Filter
            </Button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Max Bid</p>
                <p className="text-lg font-semibold">${filter.maxBid}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Weekly</p>
                <p className="text-lg font-semibold">${filter.maxWeeklySpend}</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Weekly Spend</span>
                <span className="font-medium">${filter.currentSpend} / ${filter.maxWeeklySpend}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    budgetReached ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {filter.filters.locations && filter.filters.locations.length > 0 ? (
                <p><span className="text-muted-foreground">Locations:</span> {filter.filters.locations.join(", ")}</p>
              ) : (
                <p className="text-yellow-600"><span className="font-semibold">⚠ Locations Required:</span> Edit this filter to add locations, or it will use all your coverage areas</p>
              )}
              {filter.filters.fullPartTime && (
                <p><span className="text-muted-foreground">Full/Part Time:</span> {filter.filters.fullPartTime === 'both' ? 'Both' : filter.filters.fullPartTime === 'full' ? 'Full Time' : 'Part Time'}</p>
              )}
              {filter.filters.motivationMin && (
                <p><span className="text-muted-foreground">Motivation Min:</span> {filter.filters.motivationMin}/10</p>
              )}
              {filter.filters.minTransactions && (
                <p><span className="text-muted-foreground">Min Transactions:</span> {filter.filters.minTransactions}+</p>
              )}
              {filter.filters.minExperience && (
                <p><span className="text-muted-foreground">Yrs Experience:</span> {filter.filters.minExperience}+ years</p>
              )}
              {filter.filters.targetBrokerages && filter.filters.targetBrokerages.length > 0 && (
                <p><span className="text-muted-foreground">Target Brokerages:</span> {filter.filters.targetBrokerages.join(", ")}</p>
              )}
              {filter.filters.exclusive && (
                <Badge variant="secondary" className="mt-1">Exclusive Only</Badge>
              )}
            </div>

            <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
              Edit Filter
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
